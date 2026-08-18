import os
import unittest
from unittest.mock import patch

import psycopg2

import crawl_news
from rss_sources import RssFeed


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


@unittest.skipUnless(TEST_DATABASE_URL, "TEST_DATABASE_URL chưa được cấu hình")
class RssPostgresIntegrationTests(unittest.TestCase):
    feeds = (
        RssFeed("VnExpress RSS", "https://vnexpress.net/rss/n5.rss", ("vnexpress.net",)),
        RssFeed("Thanh Nien RSS", "https://thanhnien.vn/rss/n5.rss", ("thanhnien.vn",)),
        RssFeed("CafeBiz RSS", "https://cafebiz.vn/rss/n5.rss", ("cafebiz.vn",)),
        RssFeed("VnEconomy RSS", "https://vneconomy.vn/n5.rss", ("vneconomy.vn",)),
    )
    articles = {
        "VnExpress RSS": (
            "https://vnexpress.net/wikistock-n5-fpt.html",
            "Tập đoàn FPT công bố dự án mới",
        ),
        "Thanh Nien RSS": (
            "https://thanhnien.vn/wikistock-n5-hpg.htm",
            "Hòa Phát mở rộng nhà máy",
        ),
        "CafeBiz RSS": (
            "https://cafebiz.vn/wikistock-n5-fpt.chn",
            "FPT Software tăng trưởng tại thị trường mới",
        ),
        "VnEconomy RSS": (
            "https://vneconomy.vn/wikistock-n5-fpt-hpg.htm",
            "Tập đoàn FPT và Hòa Phát cùng công bố kế hoạch",
        ),
    }

    @classmethod
    def setUpClass(cls):
        cls.connection = psycopg2.connect(TEST_DATABASE_URL)
        with cls.connection.cursor() as cursor:
            cursor.execute("SELECT current_database()")
            database_name = cursor.fetchone()[0]
            if not database_name.endswith("_test"):
                raise RuntimeError("TEST_DATABASE_URL phải trỏ tới database có hậu tố _test")

            cursor.execute(
                """
                SELECT source_name, source_id
                FROM data_source
                WHERE source_name = ANY(%s)
                """,
                ([feed.source_name for feed in cls.feeds],),
            )
            cls.source_ids = dict(cursor.fetchall())
            if len(cls.source_ids) != len(cls.feeds):
                raise RuntimeError("Database test chưa seed đủ nguồn RSS")

            cursor.execute(
                "SELECT ticker FROM company WHERE ticker = ANY(%s)",
                (["FPT", "HPG"],),
            )
            if {row[0] for row in cursor.fetchall()} != {"FPT", "HPG"}:
                raise RuntimeError("Database test chưa seed FPT và HPG")

            cursor.execute(
                """
                SELECT COALESCE(MAX(log_id), 0)
                FROM data_ingestion_log
                WHERE source_id = ANY(%s)
                """,
                (list(cls.source_ids.values()),),
            )
            cls.log_baseline = cursor.fetchone()[0]
            cls._delete_test_articles(cursor)
        cls.connection.commit()

    @classmethod
    def tearDownClass(cls):
        try:
            with cls.connection.cursor() as cursor:
                cls._delete_test_articles(cursor)
                for source_id in cls.source_ids.values():
                    cursor.execute(
                        "DELETE FROM data_ingestion_log WHERE source_id = %s AND log_id > %s",
                        (source_id, cls.log_baseline),
                    )
            cls.connection.commit()
        finally:
            cls.connection.close()

    @classmethod
    def _delete_test_articles(cls, cursor):
        urls = [article[0] for article in cls.articles.values()]
        cursor.execute(
            """
            DELETE FROM news_article_company
            WHERE article_id IN (SELECT article_id FROM news_article WHERE url = ANY(%s))
            """,
            (urls,),
        )
        cursor.execute("DELETE FROM news_article WHERE url = ANY(%s)", (urls,))

    @staticmethod
    def _connect():
        return psycopg2.connect(TEST_DATABASE_URL)

    def _fetcher(self, version):
        def fetch(feed):
            url, base_title = self.articles[feed.source_name]
            title = f"{base_title} - cập nhật" if version == 3 else base_title
            summary = f"Tóm tắt phiên bản {version}"
            return f"""<rss><channel><item>
              <title>{title}</title><link>{url}</link>
              <pubDate>Mon, 17 Aug 2026 10:00:00 +0700</pubDate>
              <description>{summary}</description>
            </item></channel></rss>""".encode("utf-8")

        return fetch

    def _database_counts(self):
        urls = [article[0] for article in self.articles.values()]
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM news_article WHERE url = ANY(%s)", (urls,))
            article_count = cursor.fetchone()[0]
            cursor.execute(
                """
                SELECT COUNT(*) FROM news_article_company
                WHERE article_id IN (SELECT article_id FROM news_article WHERE url = ANY(%s))
                """,
                (urls,),
            )
            link_count = cursor.fetchone()[0]
            cursor.execute(
                """
                SELECT COUNT(*) FROM data_ingestion_log
                WHERE source_id = ANY(%s)
                  AND log_id > %s
                """,
                (
                    list(self.source_ids.values()),
                    self.log_baseline,
                ),
            )
            log_count = cursor.fetchone()[0]
        return article_count, link_count, log_count

    def test_idempotency_updates_and_logs_on_real_postgres(self):
        with patch.object(crawl_news, "get_connection", side_effect=self._connect):
            first = crawl_news.crawl_news(("FPT", "HPG"), self.feeds, self._fetcher(1))
            self.assertEqual(first["status"], "success")
            self.assertEqual(self._database_counts(), (4, 5, 4))

            second = crawl_news.crawl_news(("FPT", "HPG"), self.feeds, self._fetcher(1))
            self.assertEqual(second["status"], "success")
            self.assertEqual(self._database_counts(), (4, 5, 8))

            third = crawl_news.crawl_news(("FPT", "HPG"), self.feeds, self._fetcher(3))
            self.assertEqual(third["status"], "success")
            self.assertEqual(self._database_counts(), (4, 5, 12))

        url = self.articles["VnExpress RSS"][0]
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT title, summary FROM news_article WHERE url = %s", (url,))
            title, summary = cursor.fetchone()
        self.assertTrue(title.endswith("- cập nhật"))
        self.assertEqual(summary, "Tóm tắt phiên bản 3")


if __name__ == "__main__":
    unittest.main()
