"""Tạo và chấm phiếu review thủ công cho các liên kết doanh nghiệp từ RSS."""

import argparse
import csv
from collections import defaultdict
from pathlib import Path

from news_matcher import match_companies
from rss_client import fetch_feed
from rss_parser import parse_feed
from rss_sources import load_enabled_feeds


FIELDS = (
    "source",
    "title",
    "summary",
    "url",
    "published_at",
    "matched_tickers",
    "relevance_scores",
    "rules",
    "is_correct",
    "review_reason",
)
TRUE_LABELS = {"true", "yes", "1", "đúng"}
FALSE_LABELS = {"false", "no", "0", "sai"}
AMBIGUOUS_TICKERS = {"GAS", "VIC", "SSI"}


def export_review(output_path, per_source=20, feeds=None, fetcher=fetch_feed):
    if per_source < 1:
        raise ValueError("per_source phải lớn hơn 0")
    rows = defaultdict(list)
    seen_urls = set()
    errors = {}
    for feed in feeds or load_enabled_feeds():
        rows[feed.source_name]
        try:
            result = parse_feed(fetcher(feed), feed)
        except Exception as error:
            errors[feed.feed_url] = str(error)
            continue
        for article in result.articles:
            matches = match_companies(article["title"], article["summary"])
            if not matches or article["url"] in seen_urls:
                continue
            seen_urls.add(article["url"])
            rows[feed.source_name].append(
                {
                    "source": feed.source_name,
                    "title": article["title"],
                    "summary": article["summary"] or "",
                    "url": article["url"],
                    "published_at": article["published_at"],
                    "matched_tickers": ",".join(match.ticker for match in matches),
                    "relevance_scores": ",".join(
                        str(match.relevance_score) for match in matches
                    ),
                    "rules": ",".join(match.rule for match in matches),
                    "is_correct": "",
                    "review_reason": "",
                }
            )

    selected = [row for source_rows in rows.values() for row in source_rows[:per_source]]
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(selected)
    return {
        "rows_by_source": {
            source: min(len(source_rows), per_source) for source, source_rows in rows.items()
        },
        "errors": errors,
    }


def score_review(path):
    reviewed = []
    with Path(path).open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            label = row["is_correct"].strip().casefold()
            if label in TRUE_LABELS:
                reviewed.append((row, True))
            elif label in FALSE_LABELS:
                reviewed.append((row, False))
            else:
                raise ValueError(f"Chưa review hoặc nhãn không hợp lệ: {row['url']}")

    if not reviewed:
        raise ValueError("Phiếu review không có bài nào")
    correct = sum(is_correct for _, is_correct in reviewed)
    ambiguous_false_positives = sum(
        not is_correct
        and bool(set(row["matched_tickers"].split(",")) & AMBIGUOUS_TICKERS)
        for row, is_correct in reviewed
    )
    precision = correct / len(reviewed)
    return {
        "reviewed": len(reviewed),
        "correct": correct,
        "precision": precision,
        "ambiguous_false_positives": ambiguous_false_positives,
        "passed": precision >= 0.98 and ambiguous_false_positives == 0,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Tạo hoặc chấm phiếu review tin RSS")
    parser.add_argument("--output", default="reports/rss_news_review.csv")
    parser.add_argument("--per-source", type=int, default=20)
    parser.add_argument("--score", action="store_true", help="Chấm phiếu đã được BA điền")
    args = parser.parse_args(argv)

    if args.score:
        result = score_review(args.output)
        print(result)
        return 0 if result["passed"] else 1

    result = export_review(args.output, args.per_source)
    print({"output": args.output, **result})
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
