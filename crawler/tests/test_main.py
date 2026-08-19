import unittest
from unittest.mock import patch

import main
from config import DEMO_TICKERS


class FakeCursor:
    def __init__(self, lock_acquired=True):
        self.lock_acquired = lock_acquired

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, _query, _params=None):
        pass

    def fetchone(self):
        return (self.lock_acquired,)


class FakeConnection:
    def __init__(self, lock_acquired=True):
        self.lock_acquired = lock_acquired
        self.closed = False

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return FakeCursor(self.lock_acquired)

    def close(self):
        self.closed = True


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
        crawl_news.assert_called_once_with(DEMO_TICKERS, feeds=None)
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
        crawl_news.assert_called_once_with(("FPT",), feeds=None)
        write_log.assert_not_called()

    def test_news_stage_skips_when_another_process_holds_the_lock(self):
        connection = FakeConnection(lock_acquired=False)
        with (
            patch.object(main, "get_connection", return_value=connection),
            patch.object(main, "verify_schema"),
            patch.object(main, "crawl_news") as crawl_news,
            patch("builtins.print"),
        ):
            exit_code = main.main(["--stage", "news"])

        self.assertEqual(exit_code, 0)
        self.assertTrue(connection.closed)
        crawl_news.assert_not_called()

    def test_news_stage_can_rerun_one_source(self):
        feed = main.load_enabled_feeds()[0]
        news_result = {
            "status": "success",
            "tickers": list(DEMO_TICKERS),
            "records": 1,
            "sources": [],
        }
        with (
            patch.object(main, "get_connection", return_value=FakeConnection()),
            patch.object(main, "verify_schema"),
            patch.object(main, "load_enabled_feeds", return_value=(feed,)),
            patch.object(main, "crawl_news", return_value=news_result) as crawl_news,
            patch("builtins.print"),
        ):
            exit_code = main.main(
                ["--stage", "news", "--news-source", feed.source_name]
            )

        self.assertEqual(exit_code, 0)
        crawl_news.assert_called_once_with(DEMO_TICKERS, feeds=(feed,))


if __name__ == "__main__":
    unittest.main()
