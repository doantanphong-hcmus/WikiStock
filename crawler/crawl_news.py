"""
Crawl company news (Bước 5)
Maps company.news() to news_article + news_article_company

Strategy: Use KBS source to get all valid news articles with real URLs
"""
import psycopg2
import pandas as pd
from vnstock import Vnstock
from config import DB_CONFIG
from db import get_connection
from datetime import datetime


def crawl_company_news(ticker, company_id):
    """
    Crawl news for a single ticker and insert to news_article + news_article_company

    Uses KBS source which returns news articles.
    Only saves articles with valid URLs (no constructed /article/{id} fallback).

    Returns dict with stats: {articles_found, articles_saved, articles_skipped_no_url, success}
    """
    conn = None
    cursor = None
    stats = {'articles_found': 0, 'articles_saved': 0, 'articles_skipped_no_url': 0, 'success': False}

    try:
        v = Vnstock().stock(symbol=ticker, source='KBS')
        news_df = v.company.news()

        stats['articles_found'] = len(news_df)

        if news_df.empty:
            print(f"[{ticker}] No news available")
            stats['success'] = True
            return stats

        print(f"[{ticker}] Found {len(news_df)} news article(s) from KBS")

        conn = get_connection()
        cursor = conn.cursor()

        # Get vnstock source_id
        cursor.execute("SELECT source_id FROM data_source WHERE source_name = %s", ('vnstock',))
        source_row = cursor.fetchone()
        if not source_row:
            print(f"[{ticker}] ERROR: vnstock source not found in data_source table")
            return stats

        source_id = source_row[0]

        for _, row in news_df.iterrows():
            title = row.get('title')
            url_path = row.get('url')
            publish_time = row.get('publish_time')
            summary = row.get('head')  # Short summary/lead paragraph

            # Skip articles without title
            if pd.isna(title) or not str(title).strip():
                print(f"  [{ticker}] Skip article without title")
                continue

            # Only process articles with valid URLs
            # DO NOT construct fallback URLs like /article/{id}
            if url_path is None or pd.isna(url_path) or not str(url_path).strip():
                print(f"  [{ticker}] Skip article (no URL): {title[:60]}...")
                stats['articles_skipped_no_url'] += 1
                continue

            # Build full URL if needed
            if str(url_path).startswith('http'):
                url = str(url_path)
            else:
                # For relative paths, we need a valid base URL
                # Only use if it looks like a real path (starts with /)
                if str(url_path).startswith('/'):
                    url = f'https://cafef.vn{url_path}'
                else:
                    print(f"  [{ticker}] Skip article (invalid URL format): {title[:60]}...")
                    stats['articles_skipped_no_url'] += 1
                    continue

            # Parse publish_time
            published_at = None
            if publish_time:
                try:
                    if isinstance(publish_time, str):
                        published_at = datetime.fromisoformat(publish_time.replace('Z', '+00:00'))
                    else:
                        published_at = publish_time
                except Exception:
                    pass

            # Insert news_article (upsert by url)
            try:
                cursor.execute("""
                    INSERT INTO news_article (source_id, title, url, published_at, summary)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (url) DO UPDATE
                        SET title = EXCLUDED.title,
                            published_at = COALESCE(EXCLUDED.published_at, news_article.published_at),
                            summary = COALESCE(EXCLUDED.summary, news_article.summary)
                    RETURNING article_id
                """, (source_id, title, url, published_at, summary))

                article_id = cursor.fetchone()[0]

                # Link article to company (upsert)
                cursor.execute("""
                    INSERT INTO news_article_company (article_id, company_id, relevance_score)
                    VALUES (%s, %s, 1.0)
                    ON CONFLICT (article_id, company_id) DO NOTHING
                """, (article_id, company_id))

                print(f"  [{ticker}] [OK] {title[:70]}...")
                stats['articles_saved'] += 1

            except Exception as e:
                print(f"  [{ticker}] ERROR saving article: {e}")
                # Continue with next article

        conn.commit()
        stats['success'] = True
        print(f"[{ticker}] News: {stats['articles_saved']}/{stats['articles_found']} articles saved")
        if stats['articles_skipped_no_url'] > 0:
            print(f"  (skipped {stats['articles_skipped_no_url']} articles without valid URL)")

        return stats

    except Exception as e:
        print(f"[{ticker}] News ERROR: {e}")
        if conn:
            conn.rollback()
        return stats
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def main():
    """Test with FPT only"""
    print("=== Crawl Company News (Bước 5) ===\n")

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

    stats = crawl_company_news('FPT', company_id)
    if stats['success']:
        print(f"\n[OK] Check database for FPT news data")
        print(f"     Articles: {stats['articles_saved']}/{stats['articles_found']} saved")
    else:
        print("\n[FAIL] News crawl did not complete; no changes were committed.")


if __name__ == "__main__":
    main()
