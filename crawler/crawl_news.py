"""Tải, đối chiếu và lưu tin RSS theo từng nguồn độc lập."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from db import (
    get_company_ids,
    get_connection,
    get_source_id,
    insert_ingestion_log,
    upsert_news_article,
    upsert_news_company,
)
from news_matcher import match_companies
from rss_client import fetch_feed
from rss_parser import parse_feed
from rss_sources import load_enabled_feeds


def _new_summary(source_name):
    return {
        "source": source_name,
        "status": "success",
        "fetched": 0,
        "parsed": 0,
        "invalid_title": 0,
        "invalid_url": 0,
        "skipped_items": 0,
        "unmatched": 0,
        "matched_articles": 0,
        "company_links": 0,
        "inserted_or_updated": 0,
        "errors": [],
        "warnings": [],
    }


def _source_status(summary, successful_feeds):
    if successful_feeds == 0:
        return "failed"
    if summary["errors"] or summary["invalid_title"] or summary["invalid_url"]:
        return "partial"
    return "success"


def crawl_news(tickers, feeds=None, fetcher=None, now=None):
    """Mỗi feed chỉ tải một lần rồi mới đối chiếu với các mã được yêu cầu."""
    tickers = tuple(dict.fromkeys(ticker.upper() for ticker in tickers))
    feeds = tuple(feeds if feeds is not None else load_enabled_feeds())
    fetcher = fetcher or fetch_feed
    now = now or datetime.now(timezone.utc)

    with get_connection() as connection, connection.cursor() as cursor:
        company_ids = get_company_ids(cursor, tickers)
    missing = [ticker for ticker in tickers if ticker not in company_ids]
    if missing:
        raise RuntimeError(
            f"Chưa có doanh nghiệp trong DB: {', '.join(missing)}. Hãy chạy bước company trước."
        )

    feeds_by_source = defaultdict(list)
    for feed in feeds:
        feeds_by_source[feed.source_name].append(feed)

    source_summaries = []
    target_tickers = set(tickers)
    for source_name, source_feeds in feeds_by_source.items():
        summary = _new_summary(source_name)
        matched_articles = []
        seen_urls = set()
        successful_feeds = 0

        for feed in source_feeds:
            try:
                result = parse_feed(fetcher(feed), feed)
                successful_feeds += 1
                summary["fetched"] += result.fetched_items
                summary["parsed"] += len(result.articles)
                summary["invalid_title"] += result.invalid_title
                summary["invalid_url"] += result.invalid_url
                summary["skipped_items"] += result.skipped_items
            except Exception as error:
                summary["errors"].append(f"feed_error={feed.feed_url}: {error}")
                continue

            if result.fetched_items and result.skipped_items / result.fetched_items > 0.2:
                ratio = result.skipped_items / result.fetched_items
                summary["warnings"].append(
                    f"invalid_item_ratio={feed.feed_url}:{ratio:.2f}"
                )
            published_dates = [
                datetime.fromisoformat(article["published_at"]).astimezone(timezone.utc)
                for article in result.articles
                if article["published_at"]
            ]
            latest_published_at = max(published_dates) if published_dates else None
            if latest_published_at is None or latest_published_at < now - timedelta(days=7):
                latest_value = (
                    latest_published_at.isoformat() if latest_published_at else "unknown"
                )
                summary["warnings"].append(
                    f"stale_feed={feed.feed_url}:latest={latest_value}"
                )

            for article in result.articles:
                matches = tuple(
                    match
                    for match in match_companies(article["title"], article["summary"])
                    if match.ticker in target_tickers
                )
                if not matches:
                    summary["unmatched"] += 1
                elif article["url"] not in seen_urls:
                    seen_urls.add(article["url"])
                    summary["matched_articles"] += 1
                    matched_articles.append((article, matches))

        if summary["matched_articles"] == 0:
            summary["warnings"].append("matched_articles=0")

        try:
            with get_connection() as connection, connection.cursor() as cursor:
                source_id = get_source_id(cursor, source_name)
                for index, (article, matches) in enumerate(matched_articles):
                    savepoint = f"rss_article_{index}"
                    cursor.execute(f"SAVEPOINT {savepoint}")
                    try:
                        article_id = upsert_news_article(cursor, source_id, article)
                        for match in matches:
                            upsert_news_company(
                                cursor,
                                article_id,
                                company_ids[match.ticker],
                                match.relevance_score,
                            )
                        cursor.execute(f"RELEASE SAVEPOINT {savepoint}")
                        summary["inserted_or_updated"] += 1
                        summary["company_links"] += len(matches)
                    except Exception as error:
                        cursor.execute(f"ROLLBACK TO SAVEPOINT {savepoint}")
                        cursor.execute(f"RELEASE SAVEPOINT {savepoint}")
                        summary["errors"].append(f"{article['url']}: {error}")

                summary["status"] = _source_status(summary, successful_feeds)
                # ponytail: dùng cột sẵn có; chỉ thêm cột riêng khi cần dashboard.
                insert_ingestion_log(
                    cursor,
                    source_id,
                    summary["status"],
                    summary["fetched"],
                    "; ".join((*summary["errors"], *summary["warnings"])) or None,
                )
        except Exception as error:
            # Transaction của nguồn đã rollback nên không báo nhầm là đã lưu.
            summary["inserted_or_updated"] = 0
            summary["company_links"] = 0
            summary["status"] = "failed"
            summary["errors"].append(f"database: {error}")

        source_summaries.append(summary)

    statuses = [summary["status"] for summary in source_summaries]
    status = (
        "success"
        if statuses and all(item == "success" for item in statuses)
        else "failed"
        if not statuses or all(item == "failed" for item in statuses)
        else "partial"
    )
    return {
        "status": status,
        "tickers": list(tickers),
        "records": sum(item["inserted_or_updated"] for item in source_summaries),
        "sources": source_summaries,
    }


if __name__ == "__main__":
    print(crawl_news(("FPT",)))
