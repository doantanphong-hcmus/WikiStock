import unittest
from datetime import datetime, timedelta, timezone

from rss_health import evaluate_health


NOW = datetime(2026, 8, 19, 10, tzinfo=timezone.utc)


class RssHealthTests(unittest.TestCase):
    def test_healthy_source_has_no_alert(self):
        rows = [("VnExpress RSS", NOW - timedelta(minutes=20), "success", "")]

        self.assertEqual(evaluate_health(("VnExpress RSS",), rows, NOW), [])

    def test_reports_missing_stale_invalid_and_failed_status(self):
        rows = [
            (
                "VnExpress RSS",
                NOW - timedelta(minutes=100),
                "partial",
                "invalid_item_ratio=https://vnexpress.net/rss/a.rss:0.25; "
                "stale_feed=https://vnexpress.net/rss/a.rss:latest=2026-08-01T00:00:00+00:00",
            )
        ]

        alerts = evaluate_health(("VnExpress RSS", "CafeBiz RSS"), rows, NOW)

        self.assertEqual(len(alerts), 5)
        self.assertTrue(any("quá 90 phút" in alert for alert in alerts))
        self.assertTrue(any("chưa có data_ingestion_log" in alert for alert in alerts))

    def test_reports_three_consecutive_feed_failures_and_zero_matches(self):
        message = (
            "feed_error=https://vnexpress.net/rss/a.rss: HTTP 500; matched_articles=0"
        )
        rows = [
            ("VnExpress RSS", NOW - timedelta(minutes=index), "partial", message)
            for index in range(3)
        ]

        alerts = evaluate_health(("VnExpress RSS",), rows, NOW)

        self.assertTrue(any("feed lỗi 3 lần liên tiếp" in alert for alert in alerts))
        self.assertTrue(any("không khớp được bài nào" in alert for alert in alerts))


if __name__ == "__main__":
    unittest.main()
