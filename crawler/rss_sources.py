"""Đọc danh mục RSS đã được duyệt ở N0."""

import json
from dataclasses import dataclass
from pathlib import Path


CATALOG_PATH = Path(__file__).with_name("rss_sources.json")


@dataclass(frozen=True)
class RssFeed:
    source_name: str
    feed_url: str
    allowed_hostnames: tuple[str, ...]


def load_enabled_feeds(path=CATALOG_PATH):
    """Chỉ trả những feed đã được bật trong danh mục nội bộ."""
    catalog = json.loads(Path(path).read_text(encoding="utf-8"))
    feeds = []
    for source in catalog["sources"]:
        allowed = tuple(host.lower() for host in source["allowed_hostnames"])
        for feed in source["feeds"]:
            if feed["enabled"]:
                feeds.append(RssFeed(source["source_name"], feed["url"], allowed))
    return tuple(feeds)
