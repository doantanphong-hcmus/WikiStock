import csv
import tempfile
import unittest
from pathlib import Path

from rss_review import export_review, score_review
from rss_sources import RssFeed


class RssReviewTests(unittest.TestCase):
    def test_exports_and_scores_review_without_network(self):
        feed = RssFeed(
            "VnEconomy RSS",
            "https://vneconomy.vn/test.rss",
            ("vneconomy.vn",),
        )
        payload = b"""<rss><channel><item>
          <title>Vingroup hop tac cung Vinamilk</title>
          <link>https://vneconomy.vn/vic-vnm.htm</link>
          <pubDate>Mon, 17 Aug 2026 10:00:00 +0700</pubDate>
        </item></channel></rss>"""

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "review.csv"
            result = export_review(path, feeds=(feed,), fetcher=lambda _feed: payload)
            self.assertEqual(result["rows_by_source"], {"VnEconomy RSS": 1})
            self.assertEqual(result["errors"], {})

            with path.open(encoding="utf-8-sig", newline="") as file:
                rows = list(csv.DictReader(file))
                fieldnames = rows[0].keys()
            rows[0]["is_correct"] = "true"
            with path.open("w", encoding="utf-8-sig", newline="") as file:
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)

            score = score_review(path)
            self.assertEqual(score["precision"], 1.0)
            self.assertTrue(score["passed"])

    def test_exports_articles_without_a_company_match(self):
        feed = RssFeed(
            "VnEconomy RSS",
            "https://vneconomy.vn/test.rss",
            ("vneconomy.vn",),
        )
        payload = b"""<rss><channel><item>
          <title>Thi truong hom nay co nhieu bien dong</title>
          <link>https://vneconomy.vn/thi-truong.htm</link>
        </item></channel></rss>"""

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "unmatched.csv"
            result = export_review(
                path, feeds=(feed,), fetcher=lambda _feed: payload, unmatched=True
            )

            self.assertEqual(result["rows_by_source"], {"VnEconomy RSS": 1})
            with path.open(encoding="utf-8-sig", newline="") as file:
                row = next(csv.DictReader(file))
            self.assertEqual(row["matched_tickers"], "")


if __name__ == "__main__":
    unittest.main()
