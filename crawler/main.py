"""CLI chạy crawler cho một mã cổ phiếu hoặc toàn bộ danh sách demo."""

import argparse
import json
import sys

from config import DEMO_TICKERS
from crawl_company import crawl_company
from crawl_financial import crawl_financial
from crawl_news import crawl_news
from db import get_company_id, get_connection, verify_schema, write_ingestion_log

STAGES = ("company", "financial", "news")


def _existing_company_id(ticker):
    with get_connection() as connection, connection.cursor() as cursor:
        return get_company_id(cursor, ticker)


def run_ticker(ticker, selected_stage):
    stages = STAGES if selected_stage == "all" else (selected_stage,)
    result = {"ticker": ticker, "status": "success", "records": 0, "stages": {}, "errors": []}
    company_id = _existing_company_id(ticker)

    for stage in stages:
        try:
            if stage == "company":
                stage_result = crawl_company(ticker)
                company_id = stage_result["company_id"]
            else:
                if company_id is None:
                    raise RuntimeError("Chưa có doanh nghiệp trong DB; hãy chạy bước company trước")
                stage_result = (
                    crawl_financial(ticker, company_id)
                    if stage == "financial"
                    else crawl_news(ticker, company_id)
                )
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
    parser = argparse.ArgumentParser(description="Nạp dữ liệu VNStock vào WikiStock")
    parser.add_argument("--ticker", type=str.upper, help="Chỉ chạy một mã, ví dụ FPT")
    parser.add_argument(
        "--stage", choices=("all", *STAGES), default="all", help="Chỉ chạy một công đoạn"
    )
    return parser.parse_args(argv)


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
    for ticker in tickers:
        print(f"\n[{ticker}] Bắt đầu công đoạn: {args.stage}")
        result = run_ticker(ticker, args.stage)
        results.append(result)
        print(f"[{ticker}] {result['status']} - {result['records']} bản ghi")
        for error in result["errors"]:
            print(f"  Lỗi: {error}")

    succeeded = sum(result["status"] == "success" for result in results)
    failed = sum(result["status"] == "failed" for result in results)
    records = sum(result["records"] for result in results)
    errors = [f"{result['ticker']}: {error}" for result in results for error in result["errors"]]
    status = "success" if not errors else ("failed" if failed == len(results) else "partial")

    try:
        write_ingestion_log(status, records, "; ".join(errors) or None)
    except Exception as error:
        print(f"Không ghi được data_ingestion_log: {error}", file=sys.stderr)
        return 2

    summary = {
        "status": status,
        "tickers": len(results),
        "succeeded": succeeded,
        "failed": failed,
        "records": records,
        "results": results,
    }
    print("\nTỔNG KẾT")
    print(json.dumps(summary, ensure_ascii=False, indent=2, default=str))
    return 0 if status == "success" else 1


if __name__ == "__main__":
    raise SystemExit(main())
