import os
import unittest
import warnings
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen

from rss_client import fetch_feed
from rss_parser import parse_feed
from rss_sources import load_enabled_feeds


RUN_LIVE = os.getenv("RUN_LIVE_RSS_TESTS") == "1"


@unittest.skipUnless(RUN_LIVE, "đặt RUN_LIVE_RSS_TESTS=1 để gọi RSS thật")
class LiveRssSmokeTests(unittest.TestCase):
    def test_every_enabled_feed_once(self):
        for feed in load_enabled_feeds():
            with self.subTest(feed=feed.feed_url):
                content_types = []

                def inspecting_opener(request, timeout):
                    response = urlopen(request, timeout=timeout)
                    content_types.append(response.headers.get_content_type())
                    return response

                payload = fetch_feed(feed, opener=inspecting_opener, retries=0)
                result = parse_feed(payload, feed)

                self.assertEqual(len(content_types), 1)
                if content_types[0] == "text/html":
                    warnings.warn(
                        f"Feed gắn Content-Type text/html nhưng XML vẫn hợp lệ: {feed.feed_url}",
                        stacklevel=2,
                    )
                self.assertGreater(result.fetched_items, 0)
                self.assertGreater(len(result.articles), 0)

                dates = [
                    datetime.fromisoformat(article["published_at"])
                    for article in result.articles
                    if article["published_at"]
                ]
                self.assertTrue(dates)
                latest = max(date.astimezone(timezone.utc) for date in dates)
                if latest < datetime.now(timezone.utc) - timedelta(days=7):
                    warnings.warn(
                        f"Feed cũ hơn 7 ngày: {feed.feed_url} ({latest.isoformat()})",
                        stacklevel=2,
                    )


if __name__ == "__main__":
    unittest.main()
