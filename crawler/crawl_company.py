"""
Crawl company profile (Bước 3)
Maps vnstock company_overview + listing metadata to company/exchange/industry tables
"""
import pandas as pd
from vnstock import Vnstock
from config import DB_CONFIG
from db import get_connection, upsert_exchange, upsert_industry, upsert_company

# Use VCI for company overview (stable, comprehensive data)
COMPANY_SOURCE = 'VCI'


def first_present_value(row, *column_names):
    """Return the first non-empty, non-Pandas-null value from a response row."""
    for column_name in column_names:
        value = row.get(column_name)
        if value is not None and not pd.isna(value) and str(value).strip():
            return value
    return None

def crawl_company_profile(ticker):
    """
    Crawl company profile for a single ticker and insert to database
    Returns company_id on success, None on failure
    """
    try:
        # Initialize vnstock
        v = Vnstock().stock(symbol=ticker, source=COMPANY_SOURCE)

        # Get overview data
        overview = v.company.overview()
        if overview.empty:
            print(f"[{ticker}] No overview data available")
            return None

        row = overview.iloc[0]

        # Get exchange and industry from listing metadata
        listing_all = v.listing.symbols_by_exchange()
        exchange_row = listing_all[listing_all['symbol'] == ticker]
        if exchange_row.empty:
            print(f"[{ticker}] Not found in symbols_by_exchange")
            return None

        exchange_code = exchange_row.iloc[0]['exchange']
        exchange_name = exchange_code  # vnstock doesn't provide full name, use code as name

        industry_all = v.listing.symbols_by_industries()
        industry_row = industry_all[industry_all['symbol'] == ticker]
        if industry_row.empty:
            print(f"[{ticker}] No industry mapping found, using default")
            industry_code = 'UNKNOWN'
            industry_name = 'Chưa phân loại'
        else:
            industry_code = str(industry_row.iloc[0]['industry_code'])
            industry_name = industry_row.iloc[0]['industry_name']

        # Extract company fields
        company_name = first_present_value(row, 'organ_name', 'company_name') or ticker
        description = first_present_value(row, 'company_profile', 'description')
        listing_date = first_present_value(row, 'listing_date')

        # Charter capital estimation: issue_share * 10000 VND (nominal value)
        issue_share = first_present_value(row, 'issue_share')
        charter_capital = None
        if issue_share is not None and float(issue_share) > 0:
            charter_capital = float(issue_share) * 10000

        # Column naming differs between vnstock providers/releases.
        website = first_present_value(row, 'website', 'web_url', 'website_url', 'company_website')

        # Insert to database
        conn = get_connection()
        cursor = conn.cursor()

        try:
            exchange_id = upsert_exchange(cursor, exchange_code, exchange_name)
            industry_id = upsert_industry(cursor, industry_code, industry_name)
            company_id = upsert_company(
                cursor, ticker, company_name, exchange_id, industry_id,
                listing_date, charter_capital, website, description
            )

            conn.commit()
            industry_display = industry_name.encode('ascii', 'replace').decode('ascii')
            print(f"[{ticker}] Inserted company_id={company_id}, exchange={exchange_code}, industry={industry_display}")
            return company_id

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        # Escape non-ASCII characters for Windows console compatibility
        error_msg = str(e).encode('ascii', 'replace').decode('ascii')
        print(f"[{ticker}] Error: {error_msg}")
        return None

def main():
    """Test with FPT only"""
    print("=== Crawl Company Profile (Bước 3) ===\n")
    crawl_company_profile('FPT')
    print("\n[OK] Check database for FPT data")

if __name__ == "__main__":
    main()
