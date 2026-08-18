import unittest
from unittest.mock import patch

import crawl_news
from db import upsert_news_article, upsert_news_company
from rss_sources import RssFeed


class FakeCursor:
    def __init__(self):
        self.queries = []
        self.fetchone_value = (123,)

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def fetchone(self):
        return self.fetchone_value


class FakeConnection:
    def __init__(self):
        self.cursor_value = FakeCursor()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return self.cursor_value


def rss_payload(title, url):
    return f"""<rss><channel><item>
      <title>{title}</title><link>{url}</link>
      <pubDate>Mon, 17 Aug 2026 10:00:00 +0700</pubDate>
    </item></channel></rss>""".encode()


class NewsPersistenceTests(unittest.TestCase):
    def test_upserts_use_database_uniqueness_and_preserve_optional_metadata(self):
        cursor = FakeCursor()
        article = {
            "title": "Tin mẫu",
            "url": "https://vneconomy.vn/tin-mau",
            "published_at": None,
            "summary": None,
        }

        self.assertEqual(upsert_news_article(cursor, 7, article), 123)
        article_sql = cursor.queries[0][0]
        self.assertIn("ON CONFLICT (url)", article_sql)
        self.assertIn("COALESCE(EXCLUDED.published_at", article_sql)
        self.assertIn("COALESCE(EXCLUDED.summary", article_sql)

        upsert_news_company(cursor, 123, 9, 0.85)
        self.assertIn("ON CONFLICT (article_id, company_id)", cursor.queries[1][0])

    def test_fetches_each_feed_once_and_links_multiple_companies(self):
        feeds = (
            RssFeed("VnEconomy RSS", "https://vneconomy.vn/a.rss", ("vneconomy.vn",)),
            RssFeed("VnEconomy RSS", "https://vneconomy.vn/b.rss", ("vneconomy.vn",)),
        )
        payload = rss_payload(
            "Vingroup hợp tác cùng Vinamilk",
            "https://vneconomy.vn/vingroup-hop-tac-vinamilk.htm",
        )
        fetched = []

        def fetcher(feed):
            fetched.append(feed.feed_url)
            return payload

        connection = FakeConnection()
        with (
            patch.object(crawl_news, "get_connection", return_value=connection),
            patch.object(
                crawl_news, "get_company_ids", return_value={"VIC": 1, "VNM": 2}
            ),
            patch.object(crawl_news, "get_source_id", return_value=7),
            patch.object(crawl_news, "upsert_news_article", return_value=123) as article_upsert,
            patch.object(crawl_news, "upsert_news_company") as company_upsert,
            patch.object(crawl_news, "insert_ingestion_log") as log_insert,
        ):
            result = crawl_news.crawl_news(("VIC", "VNM"), feeds, fetcher)

        self.assertEqual(fetched, [feed.feed_url for feed in feeds])
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["records"], 1)
        self.assertEqual(result["sources"][0]["fetched"], 2)
        self.assertEqual(result["sources"][0]["matched_articles"], 1)
        self.assertEqual(result["sources"][0]["company_links"], 2)
        article_upsert.assert_called_once()
        self.assertEqual(company_upsert.call_count, 2)
        log_insert.assert_called_once_with(
            connection.cursor_value, 7, "success", 2, None
        )

    def test_failed_source_does_not_block_the_next_source(self):
        failed = RssFeed(
            "VnExpress RSS", "https://vnexpress.net/rss/fail.rss", ("vnexpress.net",)
        )
        healthy = RssFeed(
            "VnEconomy RSS", "https://vneconomy.vn/ok.rss", ("vneconomy.vn",)
        )

        def fetcher(feed):
            if feed is failed:
                raise ValueError("feed lỗi")
            return rss_payload("Tập đoàn FPT mở rộng đầu tư", "https://vneconomy.vn/fpt.htm")

        connection = FakeConnection()
        with (
            patch.object(crawl_news, "get_connection", return_value=connection),
            patch.object(crawl_news, "get_company_ids", return_value={"FPT": 1}),
            patch.object(crawl_news, "get_source_id", return_value=7),
            patch.object(crawl_news, "upsert_news_article", return_value=123),
            patch.object(crawl_news, "upsert_news_company"),
            patch.object(crawl_news, "insert_ingestion_log") as log_insert,
        ):
            result = crawl_news.crawl_news(("FPT",), (failed, healthy), fetcher)

        self.assertEqual(result["status"], "partial")
        self.assertEqual(
            [source["status"] for source in result["sources"]], ["failed", "success"]
        )
        self.assertEqual(log_insert.call_count, 2)


if __name__ == "__main__":
    unittest.main()
