"""HTTP client nhỏ gọn dành riêng cho các feed đã cấu hình."""

import logging
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from rss_sources import RssFeed


USER_AGENT = "WikiStock-RSS/1.0 (+https://github.com/doantanphong-hcmus/WikiStock)"
TIMEOUT_SECONDS = 10
MAX_RESPONSE_BYTES = 5 * 1024 * 1024
TRANSIENT_HTTP_CODES = {408, 429, 500, 502, 503, 504}
LOGGER = logging.getLogger(__name__)


def _validate_feed_url(url, allowed_hostnames):
    parsed = urlsplit(url)
    if (
        parsed.scheme.lower() != "https"
        or parsed.hostname not in allowed_hostnames
        or parsed.username
        or parsed.password
    ):
        raise ValueError(f"URL RSS không được phép: {url}")


def fetch_feed(feed: RssFeed, opener=urlopen, retries=2):
    """Tải một feed; retries=2 nghĩa là tối đa ba lần gọi HTTP."""
    _validate_feed_url(feed.feed_url, feed.allowed_hostnames)
    request = Request(
        feed.feed_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.1",
        },
    )

    for attempt in range(retries + 1):
        try:
            with opener(request, timeout=TIMEOUT_SECONDS) as response:
                final_url = response.geturl()
                _validate_feed_url(final_url, feed.allowed_hostnames)
                content_length = response.headers.get("Content-Length")
                if content_length and int(content_length) > MAX_RESPONSE_BYTES:
                    raise ValueError("RSS vượt giới hạn 5 MB")
                payload = response.read(MAX_RESPONSE_BYTES + 1)
                if len(payload) > MAX_RESPONSE_BYTES:
                    raise ValueError("RSS vượt giới hạn 5 MB")
                return payload
        except HTTPError as error:
            if error.code not in TRANSIENT_HTTP_CODES or attempt == retries:
                raise
        except (URLError, TimeoutError, ConnectionError):
            if attempt == retries:
                raise

    raise RuntimeError("Không thể tải RSS")


def fetch_feeds(feeds, opener=urlopen, logger=LOGGER):
    """Bỏ qua feed lỗi để một tòa soạn không chặn các nguồn còn lại."""
    fetched = []
    for feed in feeds:
        try:
            fetched.append((feed, fetch_feed(feed, opener=opener)))
        except (HTTPError, URLError, TimeoutError, ConnectionError, ValueError) as error:
            logger.warning("Bỏ qua RSS %s: %s", feed.feed_url, error)
    return tuple(fetched)
