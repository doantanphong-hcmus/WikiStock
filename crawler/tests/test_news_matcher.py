import json
import unittest
import unicodedata
from pathlib import Path

from news_matcher import match_companies


CASES_PATH = Path(__file__).parent / "fixtures" / "rss_match_cases.json"


class NewsMatcherTests(unittest.TestCase):
    def test_all_contract_cases(self):
        cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))["cases"]
        for case in cases:
            with self.subTest(case=case["id"]):
                actual = [
                    match.ticker
                    for match in match_companies(case["title"], case["summary"])
                ]
                self.assertEqual(actual, case["expected_tickers"])

    def test_returns_score_and_rule_for_each_evidence_level(self):
        examples = (
            ("PV GAS tăng lợi nhuận", None, 1.0, "strong_alias_title"),
            (
                "Doanh nghiệp năng lượng mở rộng",
                "PV GAS vừa công bố dự án mới.",
                0.85,
                "strong_alias_summary",
            ),
            (
                "Cổ phiếu GAS tăng sau báo cáo quý",
                None,
                0.8,
                "ticker_with_financial_context",
            ),
        )
        for title, summary, score, rule in examples:
            with self.subTest(rule=rule):
                match = match_companies(title, summary)[0]
                self.assertEqual(match.ticker, "GAS")
                self.assertEqual(match.relevance_score, score)
                self.assertEqual(match.rule, rule)

    def test_preserves_ticker_case_and_word_boundaries(self):
        self.assertEqual(match_companies("Cổ phiếu fpt tăng giá"), ())
        self.assertEqual(match_companies("Cổ phiếu FPTX tăng giá"), ())
        self.assertEqual(match_companies("Giá gas thế giới tăng"), ())

    def test_normalizes_unicode_and_whitespace_for_strong_aliases(self):
        title = unicodedata.normalize("NFD", "Tập đoàn") + "   FPT mở rộng đầu tư"
        self.assertEqual(match_companies(title)[0].ticker, "FPT")


if __name__ == "__main__":
    unittest.main()
