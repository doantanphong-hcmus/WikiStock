"""Thu thập tối đa bốn quý báo cáo và chỉ số tài chính gần nhất."""

from db import get_connection
from mappings import (
    BS_MAPPING,
    CF_MAPPING,
    IS_MAPPING,
    RATIO_MAPPING,
    quarter_end,
    recent_periods,
    values_for_period,
)

STATEMENT_SOURCE = "VCI"
RATIO_SOURCE = "KBS"


def _unit_multiplier(stock):
    """VNStock có thể khai báo đơn vị nghìn/triệu; thiếu thì giữ nguyên."""
    try:
        value = int(getattr(stock, "unit_multiplier", 1))
        return value if value > 0 else 1
    except (TypeError, ValueError):
        return 1


def _upsert_report(cursor, company_id, period):
    year, quarter = period
    cursor.execute(
        """
        INSERT INTO financial_report (
            company_id, period_type, fiscal_year, fiscal_quarter, report_date
        )
        VALUES (%s, 'Q', %s, %s, %s)
        ON CONFLICT (company_id, period_type, fiscal_year, fiscal_quarter)
        DO UPDATE SET report_date = EXCLUDED.report_date
        RETURNING report_id
        """,
        (company_id, year, quarter, quarter_end(year, quarter)),
    )
    return cursor.fetchone()[0]


def _upsert_line_items(cursor, report_id, values, metric_ids):
    count = 0
    for metric_code, value in values.items():
        metric_id = metric_ids.get(metric_code)
        if metric_id is None:
            continue
        cursor.execute(
            """
            INSERT INTO financial_line_item (report_id, metric_id, value)
            VALUES (%s, %s, %s)
            ON CONFLICT (report_id, metric_id) DO UPDATE SET value = EXCLUDED.value
            """,
            (report_id, metric_id, value),
        )
        count += 1
    return count


def crawl_financial(ticker, company_id):
    from vnstock import Vnstock

    vci = Vnstock().stock(symbol=ticker, source=STATEMENT_SOURCE)
    balance_sheet = vci.finance.balance_sheet(period="quarter", lang="en")
    income_statement = vci.finance.income_statement(period="quarter", lang="en")
    cash_flow = vci.finance.cash_flow(period="quarter", lang="en")
    ratio = Vnstock().stock(symbol=ticker, source=RATIO_SOURCE).finance.ratio(period="quarter")

    periods = recent_periods(balance_sheet, income_statement, cash_flow, ratio)
    if not periods:
        raise RuntimeError("VNStock không trả kỳ tài chính hợp lệ")

    multiplier = _unit_multiplier(vci)
    reports = line_items = 0
    saved_metrics = set()
    with get_connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT metric_code, metric_id FROM metric")
        metric_ids = dict(cursor.fetchall())

        for period in periods:
            values = {}
            # Cùng metric ở bảng trước được ưu tiên để tránh ghi đè không rõ nguồn.
            for frame, mapping, factor in (
                (balance_sheet, BS_MAPPING, multiplier),
                (income_statement, IS_MAPPING, multiplier),
                (cash_flow, CF_MAPPING, multiplier),
                (ratio, RATIO_MAPPING, 1),
            ):
                for code, value in values_for_period(frame, mapping, period, factor).items():
                    values.setdefault(code, value)

            if not values:
                continue
            report_id = _upsert_report(cursor, company_id, period)
            line_items += _upsert_line_items(cursor, report_id, values, metric_ids)
            saved_metrics.update(code for code in values if code in metric_ids)
            reports += 1

    return {
        "reports": reports,
        "line_items": line_items,
        "metrics": sorted(saved_metrics),
        "records": reports + line_items,
    }


if __name__ == "__main__":
    from db import get_company_id

    with get_connection() as connection, connection.cursor() as cursor:
        fpt_id = get_company_id(cursor, "FPT")
    if fpt_id is None:
        raise SystemExit("Chưa có FPT. Hãy chạy crawl_company.py trước.")
    print(crawl_financial("FPT", fpt_id))
