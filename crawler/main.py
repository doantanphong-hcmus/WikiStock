"""CLI chạy crawler cho một mã cổ phiếu hoặc toàn bộ danh sách demo."""

import argparse
import json
import sys

from config import DEMO_TICKERS
from crawl_company import crawl_company
from crawl_financial import crawl_financial
from crawl_news import crawl_news
from db import get_company_id, get_connection, verify_schema, write_ingestion_log
from rss_sources import load_enabled_feeds

CORE_STAGES = ("company", "financial")
STAGES = (*CORE_STAGES, "news")
RSS_ADVISORY_LOCK_ID = 879447026


def _existing_company_id(ticker):
    with get_connection() as connection, connection.cursor() as cursor:
        return get_company_id(cursor, ticker)


def _acquire_rss_lock():
    """Giữ kết nối mở để PostgreSQL tự nhả khóa khi tiến trình kết thúc."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pg_try_advisory_lock(%s)", (RSS_ADVISORY_LOCK_ID,)
            )
            if cursor.fetchone()[0]:
                return connection
    except Exception:
        connection.close()
        raise
    connection.close()
    return None


def run_ticker(ticker, selected_stage):
    if selected_stage == "news":
        raise ValueError("Tin RSS phải chạy theo batch, không chạy qua run_ticker")
    stages = CORE_STAGES if selected_stage == "all" else (selected_stage,)
    result = {"ticker": ticker, "status": "success", "records": 0, "stages": {}, "errors": []}
    company_id = _existing_company_id(ticker)

    for stage in stages:
        try:
            if stage == "company":
                stage_result = crawl_company(ticker)
                company_id = stage_result["company_id"]
            elif stage == "financial":
                if company_id is None:
                    raise RuntimeError("Chưa có doanh nghiệp trong DB; hãy chạy bước company trước")
                stage_result = crawl_financial(ticker, company_id)
            result["stages"][stage] = stage_result
            result["records"] += stage_result.get("records", 0)
        except Exception as error:
            message = f"{stage}: {error}"
            result["stages"][stage] = {"error": str(error)}
            result["errors"].append(message)

    if result["errors"]:
        result["status"] = "partial" if result["records"] else "failed"
    return result


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Nạp dữ liệu doanh nghiệp, tài chính và RSS")
    parser.add_argument("--ticker", type=str.upper, help="Chỉ chạy một mã, ví dụ FPT")
    parser.add_argument(
        "--stage", choices=("all", *STAGES), default="all", help="Chỉ chạy một công đoạn"
    )
    parser.add_argument(
        "--news-source",
        help="Chỉ chạy một nguồn RSS, ví dụ 'VnExpress RSS'",
    )
    args = parser.parse_args(argv)
    if args.news_source and args.stage != "news":
        parser.error("--news-source chỉ dùng cùng --stage news")
    return args


def main(argv=None):
    args = parse_args(argv)
    tickers = (args.ticker,) if args.ticker else DEMO_TICKERS

    try:
        with get_connection() as connection, connection.cursor() as cursor:
            verify_schema(cursor)
    except Exception as error:
        print(f"Không thể chạy crawler: {error}", file=sys.stderr)
        return 2

    results = []
    component_statuses = []
    if args.stage != "news":
        for ticker in tickers:
            print(f"\n[{ticker}] Bắt đầu công đoạn: {args.stage}")
            result = run_ticker(ticker, args.stage)
            results.append(result)
            print(f"[{ticker}] {result['status']} - {result['records']} bản ghi")
            for error in result["errors"]:
                print(f"  Lỗi: {error}")

        failed = sum(result["status"] == "failed" for result in results)
        core_records = sum(result["records"] for result in results)
        core_errors = [
            f"{result['ticker']}: {error}"
            for result in results
            for error in result["errors"]
        ]
        core_status = (
            "success"
            if not core_errors
            else "failed"
            if failed == len(results)
            else "partial"
        )
        component_statuses.append(core_status)
        try:
            write_ingestion_log(core_status, core_records, "; ".join(core_errors) or None)
        except Exception as error:
            print(f"Không ghi được data_ingestion_log: {error}", file=sys.stderr)
            return 2

    news_result = None
    if args.stage in {"all", "news"}:
        print("\n[RSS] Tải mỗi feed một lần và đối chiếu doanh nghiệp")
        feeds = None
        if args.news_source:
            feeds = tuple(
                feed
                for feed in load_enabled_feeds()
                if feed.source_name.casefold() == args.news_source.casefold()
            )
            if not feeds:
                print(
                    f"Không tìm thấy nguồn RSS đang bật: {args.news_source}",
                    file=sys.stderr,
                )
                return 2

        rss_lock = None
        try:
            rss_lock = _acquire_rss_lock()
            if rss_lock is None:
                print("[RSS] Bỏ qua vì một tiến trình RSS khác đang chạy")
                news_result = {
                    "status": "success",
                    "tickers": list(tickers),
                    "records": 0,
                    "sources": [],
                    "skipped": True,
                    "reason": "rss_ingestion_already_running",
                }
            else:
                news_result = crawl_news(tickers, feeds=feeds)
        except Exception as error:
            news_result = {
                "status": "failed",
                "tickers": list(tickers),
                "records": 0,
                "sources": [],
                "error": str(error),
            }
        finally:
            if rss_lock is not None:
                rss_lock.close()
        component_statuses.append(news_result["status"])

    status = (
        "success"
        if all(item == "success" for item in component_statuses)
        else "failed"
        if all(item == "failed" for item in component_statuses)
        else "partial"
    )
    succeeded = sum(result["status"] == "success" for result in results)
    failed = sum(result["status"] == "failed" for result in results)
    records = sum(result["records"] for result in results) + (
        news_result["records"] if news_result else 0
    )

    summary = {
        "status": status,
        "tickers": len(results),
        "succeeded": succeeded,
        "failed": failed,
        "records": records,
        "results": results,
        "news": news_result,
    }
    print("\nTỔNG KẾT")
    print(json.dumps(summary, ensure_ascii=False, indent=2, default=str))
    return 0 if status == "success" else 1


if __name__ == "__main__":
    raise SystemExit(main())
