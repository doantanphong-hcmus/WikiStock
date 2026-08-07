"""
Database helper functions for WikiStock crawler
Provides connection pooling and upsert helpers
"""
import psycopg2
from config import DB_CONFIG

def get_connection():
    """Get a new database connection"""
    return psycopg2.connect(**DB_CONFIG)


def upsert_exchange(cursor, exchange_code, exchange_name):
    """
    Insert or update exchange, return exchange_id
    """
    cursor.execute("""
        INSERT INTO exchange (exchange_code, exchange_name)
        VALUES (%s, %s)
        ON CONFLICT (exchange_code) DO UPDATE
            SET exchange_name = EXCLUDED.exchange_name
        RETURNING exchange_id
    """, (exchange_code, exchange_name))
    return cursor.fetchone()[0]


def upsert_industry(cursor, industry_code, industry_name):
    """
    Insert or update industry, return industry_id
    """
    cursor.execute("""
        INSERT INTO industry (industry_code, industry_name)
        VALUES (%s, %s)
        ON CONFLICT (industry_code) DO UPDATE
            SET industry_name = EXCLUDED.industry_name
        RETURNING industry_id
    """, (industry_code, industry_name))
    return cursor.fetchone()[0]


def upsert_company(cursor, ticker, company_name, exchange_id, industry_id,
                   listing_date=None, charter_capital=None, website=None, description=None):
    """
    Insert or update company, return company_id.

    Note: Uses COALESCE to preserve existing values when new values are NULL.
    This prevents accidentally overwriting good data with NULL on re-crawl.
    """
    cursor.execute("""
        INSERT INTO company (ticker, company_name, exchange_id, industry_id,
                            listing_date, charter_capital, website, description, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
        ON CONFLICT (ticker) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            exchange_id = EXCLUDED.exchange_id,
            industry_id = EXCLUDED.industry_id,
            -- Preserve existing values when new values are NULL
            listing_date = COALESCE(EXCLUDED.listing_date, company.listing_date),
            charter_capital = COALESCE(EXCLUDED.charter_capital, company.charter_capital),
            website = COALESCE(EXCLUDED.website, company.website),
            description = COALESCE(EXCLUDED.description, company.description),
            updated_at = now()
        RETURNING company_id
    """, (ticker, company_name, exchange_id, industry_id,
          listing_date, charter_capital, website, description))
    return cursor.fetchone()[0]
