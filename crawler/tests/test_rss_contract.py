import json
import unittest
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse


CRAWLER_ROOT = Path(__file__).resolve().parents[1]
SOURCE_CATALOG = CRAWLER_ROOT / "rss_sources.json"
MATCH_CASES = Path(__file__).parent / "fixtures" / "rss_match_cases.json"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


class RssContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_json(SOURCE_CATALOG)
        cls.match_data = load_json(MATCH_CASES)

    def test_source_catalog_is_complete_and_fresh(self):
        verified_at = date.fromisoformat(self.catalog["verified_at"])
        freshness_limit = verified_at - timedelta(days=self.catalog["freshness_window_days"])
        sources = self.catalog["sources"]
        feeds = [feed for source in sources for feed in source["feeds"]]

        self.assertEqual(len(sources), 5)
        self.assertEqual(len(feeds), 10)
        self.assertEqual(sum(feed["enabled"] for feed in feeds), 9)
        self.assertEqual(len({feed["url"] for feed in feeds}), len(feeds))

        for source in sources:
            allowed = set(source["allowed_hostnames"])
            self.assertEqual(urlparse(source["catalog_url"]).scheme, "https")
            self.assertEqual(urlparse(source["terms_url"]).scheme, "https")
            for feed in source["feeds"]:
                parsed_url = urlparse(feed["url"])
                self.assertEqual(parsed_url.scheme, "https")
                self.assertIn(parsed_url.hostname, allowed)
                published_date = datetime.fromisoformat(
                    feed["latest_published_at"].replace("Z", "+00:00")
                ).date()
                if feed["enabled"]:
                    self.assertGreaterEqual(published_date, freshness_limit)
                    self.assertIsNone(feed["disabled_reason"])
                else:
                    self.assertTrue(feed["disabled_reason"])

        tuoi_tre = next(source for source in sources if source["publisher"] == "Tuổi Trẻ")
        self.assertFalse(tuoi_tre["feeds"][0]["enabled"])

    def test_each_publisher_has_a_minimal_parseable_fixture(self):
        for source in self.catalog["sources"]:
            fixture = CRAWLER_ROOT / source["fixture"]
            item = ET.parse(fixture).getroot().find("./channel/item")
            self.assertIsNotNone(item, fixture)
            self.assertTrue(item.findtext("title").strip(), fixture)
            self.assertTrue(item.findtext("pubDate").strip(), fixture)

            link = item.findtext("link").strip()
            parsed_link = urlparse(link)
            self.assertIn(parsed_link.scheme, ("http", "https"), fixture)
            self.assertIn(parsed_link.hostname, source["allowed_hostnames"], fixture)

    def test_matcher_cases_cover_positive_negative_and_multi_company_results(self):
        cases = self.match_data["cases"]
        tickers = set(self.match_data["demo_tickers"])
        case_ids = {case["id"] for case in cases}
        matched_tickers = {
            ticker for case in cases for ticker in case["expected_tickers"]
        }

        self.assertGreaterEqual(len(cases), 30)
        self.assertLessEqual(len(cases), 50)
        self.assertEqual(len(case_ids), len(cases))
        self.assertEqual(matched_tickers, tickers)
        self.assertTrue(any(not case["expected_tickers"] for case in cases))
        self.assertTrue(any(len(case["expected_tickers"]) > 1 for case in cases))

        for case in cases:
            self.assertTrue(case["title"].strip())
            self.assertTrue(case["reason"].strip())
            self.assertTrue(set(case["expected_tickers"]).issubset(tickers))


if __name__ == "__main__":
    unittest.main()
