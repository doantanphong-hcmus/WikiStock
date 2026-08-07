"""
Seed lookup tables: data_source, metric
Run once before starting crawl
"""
import psycopg2
from config import DB_CONFIG, VNSTOCK_GITHUB

def seed_data_source(cursor):
    """Seed vnstock data source"""
    cursor.execute("""
        INSERT INTO data_source (source_name, source_type, reliability_tier, cost_tier, access_url)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (source_name) DO NOTHING
        RETURNING source_id
    """, ('vnstock', 'aggregator', 3, 'free', VNSTOCK_GITHUB))

    result = cursor.fetchone()
    if result:
        print(f"[data_source] Inserted vnstock (source_id={result[0]})")
    else:
        cursor.execute("SELECT source_id FROM data_source WHERE source_name = %s", ('vnstock',))
        print(f"[data_source] vnstock already exists (source_id={cursor.fetchone()[0]})")

def seed_metrics(cursor):
    """Seed financial metrics"""
    metrics = [
        # Balance Sheet
        ('TOTAL_ASSETS', 'Tổng tài sản', 'VND', 'balance_sheet'),
        ('TOTAL_LIABILITIES', 'Tổng nợ phải trả', 'VND', 'balance_sheet'),
        ('TOTAL_EQUITY', 'Vốn chủ sở hữu', 'VND', 'balance_sheet'),
        ('SHORT_TERM_ASSETS', 'Tài sản ngắn hạn', 'VND', 'balance_sheet'),
        ('LONG_TERM_ASSETS', 'Tài sản dài hạn', 'VND', 'balance_sheet'),
        ('SHORT_TERM_LIABILITIES', 'Nợ ngắn hạn', 'VND', 'balance_sheet'),
        ('LONG_TERM_LIABILITIES', 'Nợ dài hạn', 'VND', 'balance_sheet'),

        # Income Statement
        ('REVENUE', 'Doanh thu', 'VND', 'income_statement'),
        ('GROSS_PROFIT', 'Lợi nhuận gộp', 'VND', 'income_statement'),
        ('OPERATING_PROFIT', 'Lợi nhuận hoạt động', 'VND', 'income_statement'),
        ('NET_PROFIT', 'Lợi nhuận sau thuế', 'VND', 'income_statement'),
        ('EPS', 'Lãi cơ bản trên cổ phiếu', 'VND', 'income_statement'),

        # Cash Flow
        ('OPERATING_CASH_FLOW', 'Dòng tiền hoạt động kinh doanh', 'VND', 'cash_flow'),
        ('INVESTING_CASH_FLOW', 'Dòng tiền hoạt động đầu tư', 'VND', 'cash_flow'),
        ('FINANCING_CASH_FLOW', 'Dòng tiền hoạt động tài chính', 'VND', 'cash_flow'),

        # Ratios
        ('ROE', 'Tỷ suất sinh lợi trên vốn chủ sở hữu', '%', 'ratio'),
        ('ROA', 'Tỷ suất sinh lợi trên tài sản', '%', 'ratio'),
        ('PE', 'Hệ số P/E', 'ratio', 'ratio'),
        ('PB', 'Hệ số P/B', 'ratio', 'ratio'),
        ('DEBT_TO_EQUITY', 'Hệ số nợ/vốn chủ sở hữu', 'ratio', 'ratio'),
        ('CURRENT_RATIO', 'Hệ số thanh toán hiện hành', 'ratio', 'ratio'),
        ('QUICK_RATIO', 'Hệ số thanh toán nhanh', 'ratio', 'ratio'),
        ('GROSS_MARGIN', 'Biên lợi nhuận gộp', '%', 'ratio'),
        ('NET_MARGIN', 'Biên lợi nhuận ròng', '%', 'ratio'),
        ('ASSET_TURNOVER', 'Vòng quay tài sản', 'lần', 'ratio'),
    ]

    inserted = 0
    for metric_code, metric_name, unit, statement_type in metrics:
        cursor.execute("""
            INSERT INTO metric (metric_code, metric_name, unit, statement_type)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (metric_code) DO NOTHING
        """, (metric_code, metric_name, unit, statement_type))
        if cursor.rowcount > 0:
            inserted += 1

    print(f"[metric] Inserted {inserted} new metrics (total defined: {len(metrics)})")

def main():
    """Run all seeding tasks"""
    print("=== Seeding lookup tables ===\n")

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        seed_data_source(cursor)
        seed_metrics(cursor)
        print("\n[OK] Seeding completed")
    except Exception as e:
        print(f"\n[FAIL] Seeding failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
