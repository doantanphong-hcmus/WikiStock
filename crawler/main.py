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

            # Count as success only if we have company + at least 1 financial report
            if ticker_stats['company'] and ticker_stats['financial_reports'] > 0:
                stats['companies_processed'] += 1
                stats['financial_reports'] += ticker_stats['financial_reports']
                stats['financial_line_items'] += ticker_stats['financial_line_items']
                stats['news_articles'] += ticker_stats['news_articles']
                print(f"\n[OK] [{ticker}] Done: {ticker_stats['financial_reports']} reports, "
                      f"{ticker_stats['financial_line_items']} line_items, "
                      f"{ticker_stats['news_articles']} news")
            else:
                raise Exception("Insufficient data: missing company or financial reports")

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
            print(f"{ticker}: ERROR - {t_stats['error']}")
        else:
            print(f"{ticker}: [OK] {t_stats['financial_reports']} reports, "
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
