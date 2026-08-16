"""Kết nối và ghi dữ liệu vào schema do Backend quản lý."""

import psycopg2

from config import DATABASE_URL, DB_CONFIG, VNSTOCK_SOURCE_NAME

REQUIRED_TABLES = {
    "company",
    "data_ingestion_log",
    "data_source",
    "exchange",
    "financial_line_item",
    "financial_report",
    "industry",
    "metric",
    "news_article",
    "news_article_company",
}


def get_connection():
    """Mở kết nối mới; ưu tiên DATABASE_URL để đồng bộ với Backend."""
    return psycopg2.connect(DATABASE_URL) if DATABASE_URL else psycopg2.connect(**DB_CONFIG)


def verify_schema(cursor):
    """Chỉ kiểm tra schema và dữ liệu nền, tuyệt đối không tạo bảng."""
    cursor.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    existing = {row[0] for row in cursor.fetchall()}
    missing = sorted(REQUIRED_TABLES - existing)
    if missing:
        raise RuntimeError(f"Thiếu bảng: {', '.join(missing)}. Hãy chạy Backend db:bootstrap trước.")

    cursor.execute("SELECT source_id FROM data_source WHERE source_name = %s", (VNSTOCK_SOURCE_NAME,))
    if cursor.fetchone() is None:
        raise RuntimeError("Thiếu data_source 'vnstock'. Hãy chạy Backend db:bootstrap trước.")

    cursor.execute("SELECT COUNT(*) FROM metric")
    if cursor.fetchone()[0] == 0:
        raise RuntimeError("Bảng metric chưa được seed. Hãy chạy Backend db:bootstrap trước.")


def get_source_id(cursor):
    cursor.execute("SELECT source_id FROM data_source WHERE source_name = %s", (VNSTOCK_SOURCE_NAME,))
    row = cursor.fetchone()
    if row is None:
        raise RuntimeError("Không tìm thấy nguồn vnstock trong data_source.")
    return row[0]


def get_company_id(cursor, ticker):
    cursor.execute("SELECT company_id FROM company WHERE ticker = %s", (ticker,))
    row = cursor.fetchone()
    return row[0] if row else None


def upsert_exchange(cursor, code, name):
    cursor.execute(
        """
        INSERT INTO exchange (exchange_code, exchange_name)
        VALUES (%s, %s)
        ON CONFLICT (exchange_code) DO UPDATE SET exchange_name = EXCLUDED.exchange_name
        RETURNING exchange_id
        """,
        (code, name),
    )
    return cursor.fetchone()[0]


def upsert_industry(cursor, code, name):
    cursor.execute(
        """
        INSERT INTO industry (industry_code, industry_name)
        VALUES (%s, %s)
        ON CONFLICT (industry_code) DO UPDATE SET industry_name = EXCLUDED.industry_name
        RETURNING industry_id
        """,
        (code, name),
    )
    return cursor.fetchone()[0]


def upsert_company(cursor, profile, exchange_id, industry_id):
    """Giữ giá trị cũ nếu lần crawl mới không trả trường tùy chọn."""
    cursor.execute(
        """
        INSERT INTO company (
            ticker, company_name, exchange_id, industry_id, listing_date,
            charter_capital, website, description, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
        ON CONFLICT (ticker) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            exchange_id = EXCLUDED.exchange_id,
            industry_id = EXCLUDED.industry_id,
            listing_date = COALESCE(EXCLUDED.listing_date, company.listing_date),
            charter_capital = COALESCE(EXCLUDED.charter_capital, company.charter_capital),
            website = COALESCE(EXCLUDED.website, company.website),
            description = COALESCE(EXCLUDED.description, company.description),
            updated_at = now()
        RETURNING company_id
        """,
        (
            profile["ticker"],
            profile["company_name"],
            exchange_id,
            industry_id,
            profile.get("listing_date"),
            profile.get("charter_capital"),
            profile.get("website"),
            profile.get("description"),
        ),
    )
    return cursor.fetchone()[0]


def write_ingestion_log(status, records_fetched, error_message=None):
    """Ghi kết quả của một lần chạy thật vào bảng theo dõi ingestion."""
    with get_connection() as connection, connection.cursor() as cursor:
        source_id = get_source_id(cursor)
        cursor.execute(
            """
            INSERT INTO data_ingestion_log (source_id, status, records_fetched, error_message)
            VALUES (%s, %s, %s, %s)
            """,
            (source_id, status, records_fetched, error_message),
        )
