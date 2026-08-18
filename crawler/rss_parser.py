"""Chuẩn hóa RSS 2.0 của mọi nguồn về cùng một cấu trúc."""

import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import timedelta, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from rss_sources import RssFeed


VIETNAM_TIMEZONE = timezone(timedelta(hours=7), "Asia/Ho_Chi_Minh")
TRACKING_PARAMETERS = {"utm_source", "utm_medium", "utm_campaign"}


@dataclass(frozen=True)
class ParseResult:
    articles: tuple[dict, ...]
    skipped_items: int
    fetched_items: int
    invalid_title: int
    invalid_url: int


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.ignored_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag.lower() in {"script", "style"}:
            self.ignored_depth += 1

    def handle_endtag(self, tag):
        if tag.lower() in {"script", "style"} and self.ignored_depth:
            self.ignored_depth -= 1

    def handle_data(self, data):
        if not self.ignored_depth:
            self.parts.append(data)


def clean_text(value):
    if not value:
        return None
    parser = _TextExtractor()
    parser.feed(unescape(value))
    text = " ".join("".join(parser.parts).split())
    return text or None


def normalize_url(value, allowed_hostnames):
    if not value:
        return None
    parsed = urlsplit(value.strip())
    scheme = parsed.scheme.lower()
    hostname = parsed.hostname.lower() if parsed.hostname else None
    if (
        scheme not in {"http", "https"}
        or hostname not in allowed_hostnames
        or parsed.username
        or parsed.password
    ):
        return None

    try:
        port = parsed.port
    except ValueError:
        return None
    netloc = hostname if port is None else f"{hostname}:{port}"
    query = urlencode(
        [
            (key, value)
            for key, value in parse_qsl(parsed.query, keep_blank_values=True)
            if key.lower() not in TRACKING_PARAMETERS
        ]
    )
    return urlunsplit((scheme, netloc, parsed.path, query, ""))


def normalize_published_at(value):
    if not value:
        return None
    # Một số feed dùng +07 thay vì dạng RFC đầy đủ +0700.
    value = re.sub(r"([+-]\d{2})$", r"\g<1>00", value.strip())
    published_at = parsedate_to_datetime(value)
    if published_at is None:
        raise ValueError(f"Ngày RSS không hợp lệ: {value}")
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=VIETNAM_TIMEZONE)
    return published_at.isoformat()


def parse_feed(payload, feed: RssFeed):
    root = ET.fromstring(payload)
    articles = []
    skipped_items = 0
    invalid_title = 0
    invalid_url = 0
    items = root.findall("./channel/item")

    for item in items:
        title = clean_text(item.findtext("title"))
        url = normalize_url(item.findtext("link"), feed.allowed_hostnames)
        invalid_title += not bool(title)
        invalid_url += not bool(url)
        if not title or not url:
            skipped_items += 1
            continue
        articles.append(
            {
                "source_name": feed.source_name,
                "feed_url": feed.feed_url,
                "title": title,
                "summary": clean_text(item.findtext("description")),
                "url": url,
                "published_at": normalize_published_at(item.findtext("pubDate")),
            }
        )

    return ParseResult(
        tuple(articles), skipped_items, len(items), invalid_title, invalid_url
    )
