import json
import math
import unittest
from pathlib import Path

import pandas as pd

from mappings import company_profile, normalize_number, recent_periods, valid_source_url, values_for_period

FIXTURE = json.loads(
    (Path(__file__).parent / "fixtures" / "vnstock_mapping.json").read_text(encoding="utf-8")
)


class MappingTests(unittest.TestCase):
    def test_company_profile_uses_known_columns(self):
        profile = company_profile("fpt", FIXTURE["profile"]["input"])
        self.assertEqual(profile["ticker"], "FPT")
        self.assertEqual(profile["company_name"], FIXTURE["profile"]["expected_name"])
        self.assertEqual(profile["charter_capital"], FIXTURE["profile"]["expected_capital"])
        self.assertEqual(profile["website"], FIXTURE["profile"]["expected_website"])

    def test_selects_four_latest_unique_quarters(self):
        frame = pd.DataFrame(columns=FIXTURE["period_columns"])
        self.assertEqual([list(item) for item in recent_periods(frame)], FIXTURE["expected_periods"])

    def test_rejects_missing_and_non_finite_numbers(self):
        for value in (None, pd.NA, float("nan"), float("inf"), -float("inf"), "sai"):
            self.assertIsNone(normalize_number(value))
        self.assertTrue(math.isclose(normalize_number(15, "ROE"), 0.15))

    def test_only_accepts_absolute_http_urls(self):
        for url in FIXTURE["urls"]["valid"]:
            self.assertEqual(valid_source_url(url), url)
        for url in FIXTURE["urls"]["invalid"]:
            self.assertIsNone(valid_source_url(url))

    def test_maps_period_without_inserting_null(self):
        frame = pd.DataFrame(
            [
                {"item_id": "net_sales", "2025-Q4": 123},
                {"item_id": "net_profit_loss_after_tax", "2025-Q4": pd.NA},
            ]
        )
        values = values_for_period(
            frame,
            {"net_sales": "REVENUE", "net_profit_loss_after_tax": "NET_PROFIT"},
            (2025, 4),
        )
        self.assertEqual(values, {"REVENUE": 123})

    def test_rejects_value_that_overflows_database_after_scaling(self):
        frame = pd.DataFrame([{"item_id": "total_assets", "2025-Q4": 10**12}])
        values = values_for_period(frame, {"total_assets": "TOTAL_ASSETS"}, (2025, 4), 10**6)
        self.assertEqual(values, {})


if __name__ == "__main__":
    unittest.main()
