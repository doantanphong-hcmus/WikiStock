import json
import unittest
from pathlib import Path
from urllib.error import URLError

from rss_client import MAX_RESPONSE_BYTES, fetch_feed, fetch_feeds
from rss_parser import normalize_published_at, parse_feed
from rss_sources import RssFeed, load_enabled_feeds


CRAWLER_ROOT = Path(__file__).resolve().parents[1]


class FakeResponse:
    def __init__(self, payload=b"<rss />", url="https://vnexpress.net/rss/test.rss"):
        self.payload = payload
        self.url = url
        self.headers = {}

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def geturl(self):
        return self.url

    def read(self, size):
        return self.payload[:size]


class RssParserTests(unittest.TestCase):
    def test_all_enabled_publishers_parse_from_offline_fixtures(self):
        catalog = json.loads((CRAWLER_ROOT / "rss_sources.json").read_text("utf-8"))
        all_feeds = load_enabled_feeds()
        feeds = {feed.source_name: feed for feed in all_feeds}
        enabled_publishers = {
            source["source_name"]
            for source in catalog["sources"]
            if any(feed["enabled"] for feed in source["feeds"])
        }

        self.assertEqual(len(all_feeds), 9)
        self.assertEqual(len(enabled_publishers), 4)
        for source in catalog["sources"]:
            if source["source_name"] not in enabled_publishers:
                continue
            payload = (CRAWLER_ROOT / source["fixture"]).read_bytes()
            result = parse_feed(payload, feeds[source["source_name"]])
            self.assertEqual(len(result.articles), 1, source["source_name"])
            self.assertEqual(result.skipped_items, 0, source["source_name"])
            self.assertIsNotNone(result.articles[0]["published_at"])

    def test_invalid_items_are_counted_and_html_is_removed(self):
        feed = RssFeed(
            "VnExpress RSS",
            "https://vnexpress.net/rss/kinh-doanh.rss",
            ("vnexpress.net",),
        )
        payload = b"""<rss><channel>
          <item><title>&lt;b&gt;Tin &amp;amp; moi&lt;/b&gt;</title>
            <link>HTTPS://VNEXPRESS.NET/bai-viet?utm_source=x&amp;id=1#top</link>
            <pubDate>Mon, 17 Aug 2026 10:00:00</pubDate>
            <description><![CDATA[<p>Tom <strong>tat</strong></p><script>alert(1)</script>]]></description>
          </item>
          <item><title>   </title><link>https://vnexpress.net/thieu-tieu-de</link></item>
          <item><title>Thieu link</title></item>
        </channel></rss>"""

        result = parse_feed(payload, feed)

        self.assertEqual(result.skipped_items, 2)
        self.assertEqual(result.fetched_items, 3)
        self.assertEqual(result.invalid_title, 1)
        self.assertEqual(result.invalid_url, 1)
        self.assertEqual(result.articles[0]["title"], "Tin & moi")
        self.assertEqual(result.articles[0]["summary"], "Tom tat")
        self.assertEqual(result.articles[0]["url"], "https://vnexpress.net/bai-viet?id=1")
        self.assertTrue(result.articles[0]["published_at"].endswith("+07:00"))

    def test_dates_with_and_without_timezone_are_normalized(self):
        self.assertTrue(
            normalize_published_at("Mon, 17 Aug 2026 10:22:40 GMT").endswith("+00:00")
        )
        self.assertTrue(
            normalize_published_at("Tue, 30 Jun 2026 17:28:00 +07").endswith("+07:00")
        )
        self.assertTrue(
            normalize_published_at("Mon, 17 Aug 2026 10:22:40").endswith("+07:00")
        )
        with self.assertRaises(ValueError):
            normalize_published_at("khong-phai-ngay")

    def test_client_retries_transient_errors_and_rejects_untrusted_urls(self):
        feed = RssFeed(
            "VnExpress RSS",
            "https://vnexpress.net/rss/kinh-doanh.rss",
            ("vnexpress.net",),
        )
        calls = []

        def flaky_opener(_request, timeout):
            calls.append(timeout)
            if len(calls) < 3:
                raise URLError("tam thoi mat mang")
            return FakeResponse()

        self.assertEqual(fetch_feed(feed, opener=flaky_opener), b"<rss />")
        self.assertEqual(calls, [10, 10, 10])

        unsafe = RssFeed("Sai", "http://127.0.0.1/rss", ("127.0.0.1",))
        with self.assertRaises(ValueError):
            fetch_feed(unsafe, opener=flaky_opener)

        with self.assertRaises(ValueError):
            fetch_feed(feed, opener=lambda *_args, **_kwargs: FakeResponse(url="https://example.com/rss"))

    def test_client_rejects_responses_larger_than_five_megabytes(self):
        feed = RssFeed(
            "VnExpress RSS",
            "https://vnexpress.net/rss/kinh-doanh.rss",
            ("vnexpress.net",),
        )
        oversized = FakeResponse(b"x" * (MAX_RESPONSE_BYTES + 1))
        with self.assertRaises(ValueError):
            fetch_feed(feed, opener=lambda *_args, **_kwargs: oversized)

    def test_one_failed_feed_does_not_block_the_next_feed(self):
        failed = RssFeed(
            "VnExpress RSS", "https://vnexpress.net/rss/loi.rss", ("vnexpress.net",)
        )
        healthy = RssFeed(
            "VnExpress RSS",
            "https://vnexpress.net/rss/kinh-doanh.rss",
            ("vnexpress.net",),
        )

        def opener(request, timeout):
            if request.full_url.endswith("loi.rss"):
                raise URLError("mat mang")
            return FakeResponse()

        with self.assertLogs("rss_client", level="WARNING"):
            fetched = fetch_feeds((failed, healthy), opener=opener)

        self.assertEqual(fetched, ((healthy, b"<rss />"),))


if __name__ == "__main__":
    unittest.main()
