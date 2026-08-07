"""
Crawl financial reports and ratios (Bước 4)
Maps balance_sheet, income_statement, cash_flow, ratio to financial_report + financial_line_item

Strategy: VCI for statements (BS/IS/CF), KBS for ratios (recent quarters align correctly)

Unit handling:
- VCI statements: multiplied by unit_multiplier to convert to base VND
  (get_unit_multiplier + apply_multiplier_to_df ensure consistent units)
- KBS ratios: values already normalized (decimal for %, ratio for ratios)
- ROE/ROA: stored as decimal (e.g., 0.15 for 15%)
"""
from datetime import date
import calendar

import pandas as pd
from vnstock import Vnstock
from config import DB_CONFIG
from db import get_connection

# Sources: VCI for statements (BS/IS/CF), KBS for ratios (recent quarters)
STATEMENT_SOURCE = 'VCI'
RATIO_SOURCE = 'KBS'

# Required metrics for a successful crawl (core financial data)
REQUIRED_METRICS = {'REVENUE', 'NET_PROFIT', 'TOTAL_LIABILITIES'}

# Mapping vnstock item_id → DB metric_code (only items we track in seed_lookup.py)
# Balance Sheet
BS_MAPPING = {
    'total_assets': 'TOTAL_ASSETS',
    'liabilities': 'TOTAL_LIABILITIES',
    'owners_equity': 'TOTAL_EQUITY',
    'current_assets': 'SHORT_TERM_ASSETS',
    'long_term_assets': 'LONG_TERM_ASSETS',
    'current_liabilities': 'SHORT_TERM_LIABILITIES',
    'long_term_liabilities': 'LONG_TERM_LIABILITIES',
}

# Income Statement
IS_MAPPING = {
    'net_sales': 'REVENUE',
    'gross_profit': 'GROSS_PROFIT',
    'operating_profit_loss': 'OPERATING_PROFIT',
    'net_profit_loss_after_tax': 'NET_PROFIT',
    'eps_basic_vnd': 'EPS',
}

# Cash Flow
CF_MAPPING = {
    'net_cash_inflows_outflows_from_operating_activities': 'OPERATING_CASH_FLOW',
    'net_cash_inflows_outflows_from_investing_activities': 'INVESTING_CASH_FLOW',
    'net_cash_inflows_outflows_from_financing_activities': 'FINANCING_CASH_FLOW',
}

# KBS Ratio (recent quarters)
# Note: KBS returns ratios already normalized (decimal format)
RATIO_MAPPING = {
    'roe': 'ROE',
    'roa': 'ROA',
    'pe_ratio': 'PE',
    'pb_ratio': 'PB',
    'debt_to_equity': 'DEBT_TO_EQUITY',
    'short_term_ratio': 'CURRENT_RATIO',
    'quick_ratio': 'QUICK_RATIO',
    'gross_margin': 'GROSS_MARGIN',
    'net_margin': 'NET_MARGIN',
    'total_asset_turnover': 'ASSET_TURNOVER',
}


def normalize_period_key(period_str):
    """
    Normalize period column name to standard format for matching.
    Input: '2026-Q2', 'Q2 2026', '2026Q2', etc.
    Output: '2026-Q2'
    """
    if not period_str:
        return None

    period_str = str(period_str).strip()

    # Already in 'YYYY-QN' format
    if '-' in period_str and 'Q' in period_str:
        return period_str

    # Try to extract year and quarter from various formats
    import re
    # Match patterns like 'Q2 2026', 'Q2-2026', '2026 Q2'
    match = re.match(r'.*?(Q[1-4]).*?(\d{4})', period_str, re.IGNORECASE)
    if match:
        quarter = match.group(1).upper()
        year = match.group(2)
        return f"{year}-{quarter}"

    return None


def parse_period(period_str):
    """
    Parse period column name like '2026-Q2' → (2026, 2)
    Returns (year, quarter) or None if invalid
    """
    try:
        normalized = normalize_period_key(period_str)
        if not normalized:
            return None

        parts = normalized.split('-')
        if len(parts) == 2 and parts[1].startswith('Q'):
            year = int(parts[0])
            quarter = int(parts[1][1:])
            if 1 <= quarter <= 4:
                return (year, quarter)
    except:
        pass
    return None


def quarter_end_date(year, quarter):
    """Return the calendar end date for a fiscal quarter."""
    month = quarter * 3
    return date(year, month, calendar.monthrange(year, month)[1])


def get_unit_multiplier(vci_stock):
    """
    Get unit_multiplier from VCI source.
    VCI may return values in thousands/millions/billions of VND.
    Returns multiplier as integer (e.g., 1000 for thousands, 1000000 for millions).
    Returns 1 if not available or on error.
    """
    try:
        # VCI stock object may expose unit_multiplier attribute
        multiplier = getattr(vci_stock, 'unit_multiplier', None)
        if multiplier is not None and multiplier > 1:
            print(f"  [INFO] VCI unit_multiplier detected: {multiplier:,}")
            return int(multiplier)
    except Exception:
        pass
    return 1


def apply_multiplier_to_df(df, multiplier):
    """
    Apply multiplier to all numeric period columns in a VCI statement DataFrame.
    Multiplies values so they are in base VND unit.
    Returns a copy of the DataFrame with values multiplied.
    """
    if multiplier <= 1:
        return df

    # Identify period columns (exclude metadata columns)
    exclude = {'item', 'item_en', 'item_id'}
    period_cols = [c for c in df.columns if c not in exclude]

    df_copy = df.copy()
    for col in period_cols:
        try:
            df_copy[col] = pd.to_numeric(df_copy[col], errors='coerce')
            df_copy[col] = df_copy[col] * multiplier
        except Exception:
            pass
    return df_copy


def normalize_value(value, metric_code):
    """
    Normalize financial value based on metric type.
    - VND amounts: keep as-is (VCI returns in VND; multiplier applied by caller)
    - Ratios: stored as-is (e.g., PE = 15.53)
    - Percentages: KBS returns as percentage (e.g., 5.89 for 5.89%), convert to decimal (0.0589)

    Returns normalized value or None if invalid
    """
    if value is None or pd.isna(value):
        return None

    # Metrics that KBS returns as percentage (not decimal)
    # These need to be divided by 100 to store as decimal
    PERCENTAGE_METRICS = {'ROE', 'ROA', 'GROSS_MARGIN', 'NET_MARGIN'}

    try:
        val = float(value)

        # Handle infinity or extremely large values (likely data error)
        if abs(val) > 1e15:
            print(f"  [WARN] Suspiciously large value {val}, skipping")
            return None

        # Convert percentage metrics from % to decimal (e.g., 5.89 -> 0.0589)
        if metric_code in PERCENTAGE_METRICS:
            val = val / 100.0

        return val
    except (ValueError, TypeError):
        return None


def upsert_financial_report(cursor, company_id, year, quarter):
    """
    Insert or get financial_report for (company_id, year, quarter)
    Returns report_id
    """
    cursor.execute("""
        INSERT INTO financial_report (company_id, period_type, fiscal_year, fiscal_quarter, report_date)
        VALUES (%s, 'Q', %s, %s, %s)
        ON CONFLICT (company_id, period_type, fiscal_year, fiscal_quarter)
        DO UPDATE SET report_date = EXCLUDED.report_date
        RETURNING report_id
    """, (company_id, year, quarter, quarter_end_date(year, quarter)))
    return cursor.fetchone()[0]


def insert_line_item(cursor, report_id, metric_code, value):
    """
    Insert a line item (upsert by report_id + metric_code)
    Skip if value is None/NaN
    Returns True if inserted/updated, False if skipped
    """
    normalized_value = normalize_value(value, metric_code)
    if normalized_value is None:
        return False

    # Get metric_id
    cursor.execute("SELECT metric_id FROM metric WHERE metric_code = %s", (metric_code,))
    row = cursor.fetchone()
    if not row:
        print(f"  [WARN] metric_code '{metric_code}' not found in DB, skipping")
        return False

    metric_id = row[0]

    cursor.execute("""
        INSERT INTO financial_line_item (report_id, metric_id, value)
        VALUES (%s, %s, %s)
        ON CONFLICT (report_id, metric_id) DO UPDATE
            SET value = EXCLUDED.value
    """, (report_id, metric_id, normalized_value))

    return True


def get_vci_period_columns(df):
    """Extract valid period columns from VCI financial statement DataFrame."""
    if df is None or df.empty:
        return []

    # Columns to exclude (metadata columns, not data columns)
    exclude_cols = {'item', 'item_en', 'item_id'}

    period_cols = []
    for col in df.columns:
        if col not in exclude_cols:
            parsed = parse_period(col)
            if parsed:
                period_cols.append(col)

    # Sort by period (newest first) and limit to 4 quarters
    period_cols.sort(key=parse_period, reverse=True)
    return period_cols[:4]


def build_ratio_lookup(ratio_df):
    """
    Build ratio lookup from KBS ratio DataFrame.
    Returns (period_cols, ratio_data_dict)
    where ratio_data_dict maps period_key -> {item_id: value}
    """
    if ratio_df is None or ratio_df.empty:
        return [], {}

    exclude_cols = {'item', 'item_id'}
    period_cols = []
    ratio_data = {}

    for col in ratio_df.columns:
        if col not in exclude_cols:
            normalized = normalize_period_key(col)
            if normalized:
                period_cols.append(col)
                ratio_data[col] = {}
                for _, row in ratio_df.iterrows():
                    item_id = row.get('item_id')
                    if item_id:
                        ratio_data[col][item_id] = row[col]

    return period_cols, ratio_data


def find_matching_period(vci_period, ratio_data, ratio_period_cols):
    """
    Find matching period in ratio data for a VCI period.
    Tries exact match first, then normalized match.
    Returns (matched_period_key, is_exact_match)
    """
    vci_normalized = normalize_period_key(vci_period)

    # Try exact column name match
    if vci_period in ratio_data:
        return vci_period, True

    # Try normalized match
    for r_period in ratio_period_cols:
        if normalize_period_key(r_period) == vci_normalized:
            return r_period, False

    return None, False


def crawl_financial_data(ticker, company_id):
    """
    Crawl financial reports (balance_sheet, income_statement, cash_flow, ratio)
    for a single ticker and insert to financial_report + financial_line_item

    Strategy:
    - VCI: balance_sheet, income_statement, cash_flow (4 recent quarters)
    - KBS: ratio (4 recent quarters, normalized period matching)

    Returns dict with stats: {reports_created, line_items_inserted, required_metrics_found}
    """
    conn = None
    cursor = None
    stats = {
        'reports_created': 0,
        'line_items_inserted': 0,
        'required_metrics_found': 0,
        'ratio_periods_matched': 0,
        'success': False
    }

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Step 1: Get VCI statements
        v_vci = Vnstock().stock(symbol=ticker, source=STATEMENT_SOURCE)

        bs = v_vci.finance.balance_sheet(period='quarter', lang='en')
        inc = v_vci.finance.income_statement(period='quarter', lang='en')
        cf = v_vci.finance.cash_flow(period='quarter', lang='en')

        # Apply unit_multiplier so values are in base VND
        multiplier = get_unit_multiplier(v_vci)
        if multiplier > 1:
            bs = apply_multiplier_to_df(bs, multiplier)
            inc = apply_multiplier_to_df(inc, multiplier)
            cf = apply_multiplier_to_df(cf, multiplier)
            print(f"  [INFO] Applied unit_multiplier={multiplier:,} to VCI statements")

        # Extract period columns from VCI
        period_cols = get_vci_period_columns(bs)

        if not period_cols:
            print(f"[{ticker}] No period columns found in statements")
            return stats

        print(f"[{ticker}] VCI periods: {[normalize_period_key(p) for p in period_cols]}")

        # Step 2: Get KBS ratio
        v_kbs = Vnstock().stock(symbol=ticker, source=RATIO_SOURCE)
        ratio = v_kbs.finance.ratio(period='quarter')

        ratio_period_cols, ratio_data = build_ratio_lookup(ratio)
        print(f"[{ticker}] KBS ratio periods: {[normalize_period_key(p) for p in ratio_period_cols]}")

        # Step 3: Process each period
        for period_col in period_cols:
            parsed = parse_period(period_col)
            if not parsed:
                print(f"  [{ticker}] Skip invalid period: {period_col}")
                continue

            year, quarter = parsed

            # Create/get report
            report_id = upsert_financial_report(cursor, company_id, year, quarter)
            period_label = f"{year}-Q{quarter}"
            print(f"  [{ticker}] {period_label} → report_id={report_id}")

            # Track metrics found for this report
            metrics_found_this_report = set()
            period_line_count = 0

            # Insert Balance Sheet items
            for _, row in bs.iterrows():
                item_id = row.get('item_id')
                if item_id in BS_MAPPING:
                    metric_code = BS_MAPPING[item_id]
                    value = row[period_col]
                    if insert_line_item(cursor, report_id, metric_code, value):
                        period_line_count += 1
                        metrics_found_this_report.add(metric_code)

            # Insert Income Statement items
            for _, row in inc.iterrows():
                item_id = row.get('item_id')
                if item_id in IS_MAPPING and period_col in inc.columns:
                    metric_code = IS_MAPPING[item_id]
                    value = row[period_col]
                    if insert_line_item(cursor, report_id, metric_code, value):
                        period_line_count += 1
                        metrics_found_this_report.add(metric_code)

            # Insert Cash Flow items
            for _, row in cf.iterrows():
                item_id = row.get('item_id')
                if item_id in CF_MAPPING and period_col in cf.columns:
                    metric_code = CF_MAPPING[item_id]
                    value = row[period_col]
                    if insert_line_item(cursor, report_id, metric_code, value):
                        period_line_count += 1

            # Insert Ratio items (match VCI period to KBS period)
            matched_period, is_exact = find_matching_period(period_col, ratio_data, ratio_period_cols)
            if matched_period:
                for item_id, value in ratio_data[matched_period].items():
                    if item_id in RATIO_MAPPING:
                        metric_code = RATIO_MAPPING[item_id]
                        if insert_line_item(cursor, report_id, metric_code, value):
                            period_line_count += 1
                            metrics_found_this_report.add(metric_code)
                stats['ratio_periods_matched'] += 1
            else:
                print(f"    [WARN] No matching KBS ratio for {period_label}")

            # Only count report if it has actual data
            if period_line_count > 0:
                stats['reports_created'] += 1
                stats['line_items_inserted'] += period_line_count
                # Count required metrics found
                required_found = metrics_found_this_report & REQUIRED_METRICS
                stats['required_metrics_found'] += len(required_found)
                print(f"    → {period_line_count} items inserted (required: {len(required_found)}/{len(REQUIRED_METRICS)})")
            else:
                print(f"    → no items inserted")

        conn.commit()
        stats['success'] = True
        print(f"[{ticker}] Summary: {stats['reports_created']} reports, {stats['line_items_inserted']} line_items, "
              f"{stats['ratio_periods_matched']}/{len(period_cols)} ratio periods matched")
        return stats

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[{ticker}] Financial data ERROR: {e}")
        return stats
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def main():
    """Test with FPT only"""
    print("=== Crawl Financial Data (Bước 4) ===\n")

    # Get FPT company_id
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT company_id FROM company WHERE ticker = %s", ('FPT',))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        print("[ERROR] FPT not found in company table. Run crawl_company.py first.")
        return

    company_id = row[0]
    print(f"FPT company_id = {company_id}\n")

    stats = crawl_financial_data('FPT', company_id)
    if stats['success']:
        print("\n[OK] Check database for FPT financial data")
        print(f"     Reports: {stats['reports_created']}, Line items: {stats['line_items_inserted']}")
    else:
        print("\n[FAIL] Financial crawl did not complete; no changes were committed.")


if __name__ == "__main__":
    main()
