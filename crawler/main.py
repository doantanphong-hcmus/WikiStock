"""
Main entry point for crawler pipeline (Bước 6)
Runs crawl_company → crawl_financial → crawl_news for all DEMO_TICKERS
"""
import sys
import io
# Fix UTF-8 encoding for Windows console - must be FIRST
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from config import DEMO_TICKERS
from crawl_company import crawl_company_profile
from crawl_financial import crawl_financial_data
from crawl_news import crawl_company_news
from db import get_connection


# Required metrics that must be present for a ticker to be considered successful
REQUIRED_METRICS = {'REVENUE', 'NET_PROFIT', 'TOTAL_LIABILITIES'}
# Financial ratios that should be present (at least one quarter)
REQUIRED_RATIOS = {'ROE', 'ROA', 'PE', 'GROSS_MARGIN'}
# Banks don't have GROSS_MARGIN in their financial statements
BANK_TICKERS = {'VCB'}
# Minimum number of quarters required
MIN_QUARTERS = 4


def validate_ticker_data(ticker):
    """
    Validate that a ticker has all required data in the database.
    Returns (is_valid, missing_data_dict)
    """
    conn = get_connection()
    cursor = conn.cursor()

    missing = {
        'quarters': [],
        'metrics': [],
        'ratios': [],
        'news_count': 0
    }

    try:
        # Check number of quarters
        cursor.execute("""
            SELECT fiscal_year, fiscal_quarter
            FROM financial_report fr
            JOIN company c ON c.company_id = fr.company_id
            WHERE c.ticker = %s AND fr.period_type = 'Q'
            ORDER BY fiscal_year DESC, fiscal_quarter DESC
        """, (ticker,))
        quarters = cursor.fetchall()

        if len(quarters) < MIN_QUARTERS:
            missing['quarters'] = [f'{y}-Q{q}' for y, q in quarters] if quarters else []

        # Check required metrics (at least one quarter must have all)
        for metric in REQUIRED_METRICS:
            cursor.execute("""
                SELECT COUNT(DISTINCT fr.report_id)
                FROM financial_line_item fli
                JOIN financial_report fr ON fr.report_id = fli.report_id
                JOIN company c ON c.company_id = fr.company_id
                JOIN metric m ON m.metric_id = fli.metric_id
                WHERE c.ticker = %s AND m.metric_code = %s AND fli.value IS NOT NULL
            """, (ticker, metric))
            count = cursor.fetchone()[0]
            if count == 0:
                missing['metrics'].append(metric)

        # Check financial ratios (at least one quarter should have these)
        for ratio in REQUIRED_RATIOS:
            # Skip GROSS_MARGIN for banks
            if ticker in BANK_TICKERS and ratio == 'GROSS_MARGIN':
                continue
            cursor.execute("""
                SELECT COUNT(DISTINCT fr.report_id)
                FROM financial_line_item fli
                JOIN financial_report fr ON fr.report_id = fli.report_id
                JOIN company c ON c.company_id = fr.company_id
                JOIN metric m ON m.metric_id = fli.metric_id
                WHERE c.ticker = %s AND m.metric_code = %s AND fli.value IS NOT NULL
            """, (ticker, ratio))
            count = cursor.fetchone()[0]
            if count == 0:
                missing['ratios'].append(ratio)

        # Check news count
        cursor.execute("""
            SELECT COUNT(*)
            FROM news_article_company nac
            JOIN company c ON c.company_id = nac.company_id
            WHERE c.ticker = %s
        """, (ticker,))
        missing['news_count'] = cursor.fetchone()[0]

        # Determine validity
        is_valid = (
            len(quarters) >= MIN_QUARTERS and
            len(missing['metrics']) == 0 and
            len(missing['ratios']) == 0 and
            missing['news_count'] > 0
        )

        return is_valid, missing

    finally:
        cursor.close()
        conn.close()


def write_ingestion_log(stats_summary):
    """
    Record this run in the schema-provided ingestion log.

    stats_summary: {
        'companies_processed': int,
        'financial_reports': int,
        'financial_line_items': int,
        'news_articles': int,
        'errors': [(ticker, error), ...]
    }
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        errors = stats_summary.get('errors', [])
        has_errors = bool(errors)
        has_success = stats_summary.get('companies_processed', 0) > 0

        if has_errors and has_success:
            status = 'partial'
        elif has_errors and not has_success:
            status = 'failed'
        else:
            status = 'success'

        # records_fetched = total records across all tables
        records_fetched = (
            stats_summary.get('companies_processed', 0) +
            stats_summary.get('financial_reports', 0) +
            stats_summary.get('financial_line_items', 0) +
            stats_summary.get('news_articles', 0)
        )

        error_message = '; '.join(f'{ticker}: {error}' for ticker, error in errors) or None

        cursor.execute(
            """
            INSERT INTO data_ingestion_log (source_id, status, records_fetched, error_message)
            SELECT source_id, %s, %s, %s
            FROM data_source
            WHERE source_name = 'vnstock'
            """,
            (status, records_fetched, error_message),
        )
        conn.commit()
    except Exception as e:
        print(f"[WARN] Could not write data_ingestion_log: {e}")
    finally:
        cursor.close()
        conn.close()


def main():
    """Run full pipeline for all demo tickers"""
    print("=== WikiStock Crawler Pipeline ===\n")
    print(f"Crawling {len(DEMO_TICKERS)} tickers: {', '.join(DEMO_TICKERS)}\n")

    # Detailed stats tracking
    stats = {
        'companies_processed': 0,
        'financial_reports': 0,
        'financial_line_items': 0,
        'news_articles': 0,
        'errors': [],
        'ticker_details': {}
    }

    for ticker in DEMO_TICKERS:
        print(f"\n{'='*60}")
        print(f"Processing {ticker}")
        print('='*60)

        ticker_stats = {
            'company': False,
            'financial_reports': 0,
            'financial_line_items': 0,
            'news_articles': 0,
            'error': None
        }

        try:
            # Step 1: Company profile
            print(f"\n[1/3] Crawling company profile...")
            company_id = crawl_company_profile(ticker)
            if not company_id:
                raise Exception("Failed to get company_id from crawl_company_profile")
            ticker_stats['company'] = True

            # Step 2: Financial data
            print(f"\n[2/3] Crawling financial data...")
            fin_stats = crawl_financial_data(ticker, company_id)
            ticker_stats['financial_reports'] = fin_stats.get('reports_created', 0)
            ticker_stats['financial_line_items'] = fin_stats.get('line_items_inserted', 0)

            # Step 3: News
            print(f"\n[3/3] Crawling news...")
            news_stats = crawl_company_news(ticker, company_id)
            ticker_stats['news_articles'] = news_stats.get('articles_saved', 0)

            # Validate that all required data is present
            is_valid, missing = validate_ticker_data(ticker)

            if ticker_stats['company'] and ticker_stats['financial_reports'] > 0 and is_valid:
                stats['companies_processed'] += 1
                stats['financial_reports'] += ticker_stats['financial_reports']
                stats['financial_line_items'] += ticker_stats['financial_line_items']
                stats['news_articles'] += ticker_stats['news_articles']
                print(f"\n[OK] [{ticker}] Done: {ticker_stats['financial_reports']} reports, "
                      f"{ticker_stats['financial_line_items']} line_items, "
                      f"{ticker_stats['news_articles']} news")
            else:
                # Build detailed error message
                error_parts = []
                if not ticker_stats['company']:
                    error_parts.append("missing company profile")
                if ticker_stats['financial_reports'] == 0:
                    error_parts.append("no financial reports")
                if len(missing['quarters']) > 0:
                    quarters_found = len(missing['quarters'])
                    error_parts.append(f"only {quarters_found}/4 quarters")
                if missing['metrics']:
                    error_parts.append(f"missing metrics: {', '.join(missing['metrics'])}")
                if missing['ratios']:
                    error_parts.append(f"missing ratios: {', '.join(missing['ratios'])}")
                if missing['news_count'] == 0:
                    error_parts.append("no news articles")

                error_msg = "; ".join(error_parts) if error_parts else "Insufficient data"
                raise Exception(error_msg)

            stats['ticker_details'][ticker] = ticker_stats

        except Exception as e:
            error_msg = str(e)
            stats['errors'].append((ticker, error_msg))
            ticker_stats['error'] = error_msg
            stats['ticker_details'][ticker] = ticker_stats
            print(f"\n[X] [{ticker}] Pipeline ERROR: {error_msg}\n")

    # Print summary
    print("\n" + "="*60)
    print("=== SUMMARY ===")
    print("="*60)
    print(f"Companies processed: {stats['companies_processed']}/{len(DEMO_TICKERS)}")
    print(f"Financial reports:   {stats['financial_reports']}")
    print(f"Line items:         {stats['financial_line_items']}")
    print(f"News articles:      {stats['news_articles']}")
    print(f"Errors:             {len(stats['errors'])}")

    if stats['errors']:
        print("\nErrors:")
        for ticker, error in stats['errors']:
            print(f"  X {ticker}: {error}")

    # Per-ticker breakdown
    print("\n--- Per-Ticker Breakdown ---")
    for ticker, t_stats in stats['ticker_details'].items():
        if t_stats['error']:
            print(f"{ticker}: FAIL - {t_stats['error']}")
        else:
            print(f"{ticker}: OK - {t_stats['financial_reports']} reports, "
                  f"{t_stats['financial_line_items']} items, "
                  f"{t_stats['news_articles']} news")

    # Write ingestion log
    write_ingestion_log(stats)

    # Final status
    if stats['companies_processed'] == len(DEMO_TICKERS):
        print("\n[SUCCESS] All tickers processed successfully!")
        return 0
    elif stats['companies_processed'] > 0:
        print(f"\n[WARNING] Partial success: {stats['companies_processed']} completed, {len(stats['errors'])} failed")
        return 1
    else:
        print("\n[FAIL] All tickers failed")
        return 2


if __name__ == "__main__":
    exit(main())
