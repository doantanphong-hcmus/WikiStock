"""Thu thập hồ sơ doanh nghiệp từ VNStock."""

from db import get_connection, upsert_company, upsert_exchange, upsert_industry
from mappings import company_profile, first_present

COMPANY_SOURCE = "VCI"


def crawl_company(ticker):
    from vnstock import Vnstock

    ticker = ticker.upper()
    stock = Vnstock().stock(symbol=ticker, source=COMPANY_SOURCE)
    overview = stock.company.overview()
    if overview is None or overview.empty:
        raise RuntimeError("VNStock không trả hồ sơ doanh nghiệp")

    exchanges = stock.listing.symbols_by_exchange()
    exchange_rows = exchanges[exchanges["symbol"].astype(str).str.upper() == ticker]
    if exchange_rows.empty:
        raise RuntimeError("Không xác định được sàn giao dịch")
    exchange_code = str(exchange_rows.iloc[0]["exchange"]).strip().upper()

    industries = stock.listing.symbols_by_industries()
    industry_rows = industries[industries["symbol"].astype(str).str.upper() == ticker]
    if industry_rows.empty:
        industry_code, industry_name = "UNKNOWN", "Chưa phân loại"
    else:
        industry_row = industry_rows.iloc[0]
        industry_code = str(first_present(industry_row, "industry_code") or "UNKNOWN")
        industry_name = str(first_present(industry_row, "industry_name") or "Chưa phân loại")

    profile = company_profile(ticker, overview.iloc[0])
    with get_connection() as connection, connection.cursor() as cursor:
        exchange_id = upsert_exchange(cursor, exchange_code, exchange_code)
        industry_id = upsert_industry(cursor, industry_code, industry_name)
        company_id = upsert_company(cursor, profile, exchange_id, industry_id)

    return {"company_id": company_id, "records": 1}


if __name__ == "__main__":
    print(crawl_company("FPT"))
