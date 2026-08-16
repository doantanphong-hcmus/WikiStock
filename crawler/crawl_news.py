"""Thu thập tin tức và chỉ lưu URL tuyệt đối do nguồn cung cấp."""

import pandas as pd

from db import get_connection, get_source_id
from mappings import first_present, valid_source_url

NEWS_SOURCE = "KBS"


def _published_at(value):
    if value is None:
        return None
    try:
        parsed = pd.to_datetime(value, errors="coerce", utc=True)
        return None if pd.isna(parsed) else parsed.to_pydatetime()
    except (TypeError, ValueError):
        return None


def crawl_news(ticker, company_id):
    from vnstock import Vnstock

    news = Vnstock().stock(symbol=ticker, source=NEWS_SOURCE).company.news()
    stats = {"found": 0, "saved": 0, "skipped_title": 0, "skipped_url": 0, "records": 0}
    if news is None or news.empty:
        return stats
    stats["found"] = len(news)

    with get_connection() as connection, connection.cursor() as cursor:
        source_id = get_source_id(cursor)
        for index, row in news.iterrows():
            title = first_present(row, "title", "news_title")
            if title is None:
                stats["skipped_title"] += 1
                continue
            url = valid_source_url(first_present(row, "url", "link", "article_url"))
            if url is None:
                stats["skipped_url"] += 1
                continue

            # Savepoint giúp một bài lỗi không làm mất các bài hợp lệ khác.
            savepoint = f"news_{stats['saved']}"
            cursor.execute(f"SAVEPOINT {savepoint}")
            try:
                cursor.execute(
                    """
                    INSERT INTO news_article (source_id, title, url, published_at, summary)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (url) DO UPDATE SET
                        title = EXCLUDED.title,
                        published_at = COALESCE(EXCLUDED.published_at, news_article.published_at),
                        summary = COALESCE(EXCLUDED.summary, news_article.summary)
                    RETURNING article_id
                    """,
                    (
                        source_id,
                        str(title).strip(),
                        url,
                        _published_at(first_present(row, "publish_time", "published_at", "date")),
                        first_present(row, "head", "summary", "description"),
                    ),
                )
                article_id = cursor.fetchone()[0]
                cursor.execute(
                    """
                    INSERT INTO news_article_company (article_id, company_id, relevance_score)
                    VALUES (%s, %s, 1.0)
                    ON CONFLICT (article_id, company_id)
                    DO UPDATE SET relevance_score = EXCLUDED.relevance_score
                    """,
                    (article_id, company_id),
                )
                cursor.execute(f"RELEASE SAVEPOINT {savepoint}")
                stats["saved"] += 1
            except Exception:
                cursor.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
                raise

    stats["records"] = stats["saved"]
    return stats


if __name__ == "__main__":
    from db import get_company_id

    with get_connection() as connection, connection.cursor() as cursor:
        fpt_id = get_company_id(cursor, "FPT")
    if fpt_id is None:
        raise SystemExit("Chưa có FPT. Hãy chạy crawl_company.py trước.")
    print(crawl_news("FPT", fpt_id))
