import unittest
from unittest.mock import patch

import main
from config import DEMO_TICKERS


class FakeCursor:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class FakeConnection:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return FakeCursor()


def successful_ticker(ticker, _stage):
    return {"ticker": ticker, "status": "success", "records": 1, "stages": {}, "errors": []}


class MainBatchTests(unittest.TestCase):
    def test_all_stage_runs_rss_once_after_all_companies(self):
        news_result = {
            "status": "success",
            "tickers": list(DEMO_TICKERS),
            "records": 2,
            "sources": [],
        }
        with (
            patch.object(main, "get_connection", return_value=FakeConnection()),
            patch.object(main, "verify_schema"),
            patch.object(main, "run_ticker", side_effect=successful_ticker) as run_ticker,
            patch.object(main, "crawl_news", return_value=news_result) as crawl_news,
            patch.object(main, "write_ingestion_log") as write_log,
            patch("builtins.print"),
        ):
            exit_code = main.main(["--stage", "all"])

        self.assertEqual(exit_code, 0)
        self.assertEqual(run_ticker.call_count, len(DEMO_TICKERS))
        crawl_news.assert_called_once_with(DEMO_TICKERS)
        write_log.assert_called_once_with("success", len(DEMO_TICKERS), None)

    def test_news_stage_does_not_write_a_vnstock_log(self):
        news_result = {
            "status": "success",
            "tickers": ["FPT"],
            "records": 1,
            "sources": [],
        }
        with (
            patch.object(main, "get_connection", return_value=FakeConnection()),
            patch.object(main, "verify_schema"),
            patch.object(main, "crawl_news", return_value=news_result) as crawl_news,
            patch.object(main, "write_ingestion_log") as write_log,
            patch("builtins.print"),
        ):
            exit_code = main.main(["--ticker", "FPT", "--stage", "news"])

        self.assertEqual(exit_code, 0)
        crawl_news.assert_called_once_with(("FPT",))
        write_log.assert_not_called()


if __name__ == "__main__":
    unittest.main()
