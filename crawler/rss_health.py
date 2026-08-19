"""Kiểm tra nhanh sức khỏe pipeline RSS từ các ingestion log gần nhất."""

import argparse
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from db import get_connection
from rss_sources import load_enabled_feeds


FEED_ERROR_PATTERN = re.compile(r"feed_error=([^:]+://[^:;]+):")


def _load_recent_logs(source_names):
    with get_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT source.source_name, log.run_at, log.status,
                   COALESCE(log.error_message, '')
            FROM data_source AS source
            LEFT JOIN LATERAL (
                SELECT run_at, status, error_message
                FROM data_ingestion_log
                WHERE source_id = source.source_id
                ORDER BY run_at DESC, log_id DESC
                LIMIT 3
            ) AS log ON TRUE
            WHERE source.source_name = ANY(%s)
            ORDER BY source.source_name, log.run_at DESC NULLS LAST
            """,
            (list(source_names),),
        )
        return cursor.fetchall()


def evaluate_health(source_names, rows, now=None, max_age_minutes=90):
    """Trả danh sách cảnh báo; không tự sửa dữ liệu hay vô hiệu hóa nguồn."""
    now = now or datetime.now(timezone.utc)
    logs = defaultdict(list)
    for source_name, run_at, status, message in rows:
        if run_at is not None:
            logs[source_name].append((run_at, status, message or ""))

    alerts = []
    for source_name in source_names:
        recent = logs[source_name]
        if not recent:
            alerts.append(f"{source_name}: chưa có data_ingestion_log")
            continue

        latest_at, latest_status, latest_message = recent[0]
        if latest_at.tzinfo is None:
            latest_at = latest_at.replace(tzinfo=timezone.utc)
        if latest_at < now - timedelta(minutes=max_age_minutes):
            alerts.append(f"{source_name}: log mới nhất đã quá {max_age_minutes} phút")
        if latest_status != "success":
            alerts.append(
                f"{source_name}: lần chạy mới nhất có trạng thái {latest_status}"
            )
        if "invalid_item_ratio=" in latest_message:
            alerts.append(f"{source_name}: hơn 20% mục RSS không hợp lệ")
        if "stale_feed=" in latest_message:
            alerts.append(f"{source_name}: feed không có bài mới trong hơn 7 ngày")

        if len(recent) >= 3:
            failed_feeds = [
                set(FEED_ERROR_PATTERN.findall(item[2])) for item in recent[:3]
            ]
            for feed_url in sorted(set.intersection(*failed_feeds)):
                alerts.append(f"{source_name}: feed lỗi 3 lần liên tiếp: {feed_url}")
            if all("matched_articles=0" in item[2] for item in recent[:3]):
                alerts.append(
                    f"{source_name}: không khớp được bài nào trong 3 lần liên tiếp"
                )
    return alerts


def main(argv=None):
    parser = argparse.ArgumentParser(description="Kiểm tra sức khỏe pipeline RSS")
    parser.add_argument("--max-age-minutes", type=int, default=90)
    args = parser.parse_args(argv)
    if args.max_age_minutes < 1:
        parser.error("--max-age-minutes phải lớn hơn 0")

    source_names = tuple(dict.fromkeys(feed.source_name for feed in load_enabled_feeds()))
    try:
        rows = _load_recent_logs(source_names)
        alerts = evaluate_health(source_names, rows, max_age_minutes=args.max_age_minutes)
    except Exception as error:
        print(json.dumps({"status": "error", "error": str(error)}, ensure_ascii=False))
        return 2

    result = {
        "status": "healthy" if not alerts else "alert",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "sources": len(source_names),
        "alerts": alerts,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not alerts else 1


if __name__ == "__main__":
    raise SystemExit(main())
