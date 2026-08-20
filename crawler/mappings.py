"""Các hàm ánh xạ thuần để có thể kiểm thử mà không gọi VNStock."""

import calendar
import math
import re
from datetime import date
from urllib.parse import urlparse

import pandas as pd

BS_MAPPING = {
    "total_assets": "TOTAL_ASSETS",
    "liabilities": "TOTAL_LIABILITIES",
    "total_liabilities": "TOTAL_LIABILITIES",
    "owners_equity": "TOTAL_EQUITY",
    "current_assets": "SHORT_TERM_ASSETS",
    "long_term_assets": "LONG_TERM_ASSETS",
    "current_liabilities": "SHORT_TERM_LIABILITIES",
    "long_term_liabilities": "LONG_TERM_LIABILITIES",
}
IS_MAPPING = {
    "net_sales": "REVENUE",
    "total_operating_income": "REVENUE",
    "gross_profit": "GROSS_PROFIT",
    "operating_profit_loss": "OPERATING_PROFIT",
    "net_profit_loss_after_tax": "NET_PROFIT",
    "eps_basic_vnd": "EPS",
}
CF_MAPPING = {
    "net_cash_inflows_outflows_from_operating_activities": "OPERATING_CASH_FLOW",
    "net_cash_inflows_outflows_from_investing_activities": "INVESTING_CASH_FLOW",
    "net_cash_inflows_outflows_from_financing_activities": "FINANCING_CASH_FLOW",
}
RATIO_MAPPING = {
    "roe": "ROE",
    "roa": "ROA",
    "pe_ratio": "PE",
    "pb_ratio": "PB",
    "debt_to_equity": "DEBT_TO_EQUITY",
    "short_term_ratio": "CURRENT_RATIO",
    "quick_ratio": "QUICK_RATIO",
    "gross_margin": "GROSS_MARGIN",
    "net_margin": "NET_MARGIN",
    "total_asset_turnover": "ASSET_TURNOVER",
}
PERCENTAGE_METRICS = {"ROE", "ROA", "GROSS_MARGIN", "NET_MARGIN"}
OFFICIAL_WEBSITES = {
    "FPT": "https://fpt.com/vi",
    "GAS": "https://www.pvgas.com.vn/",
    "HPG": "https://www.hoaphat.com.vn/",
    "HSG": "https://hoasengroup.vn/",
    "MWG": "https://mwg.vn/",
    "SSI": "https://www.ssi.com.vn/",
    "VCB": "https://www.vietcombank.com.vn/",
    "VCG": "https://vinaconex.com.vn/",
    "VIC": "https://vingroup.net/",
    "VNM": "https://www.vinamilk.com.vn/",
}


def is_missing(value):
    if value is None:
        return True
    try:
        return bool(pd.isna(value))
    except (TypeError, ValueError):
        return False


def first_present(row, *names):
    for name in names:
        value = row.get(name)
        if not is_missing(value) and str(value).strip():
            return value
    return None


def company_profile(ticker, row):
    ticker = ticker.upper()
    shares = normalize_number(first_present(row, "issue_share"))
    return {
        "ticker": ticker,
        "company_name": str(first_present(row, "organ_name", "company_name") or ticker),
        "listing_date": first_present(row, "listing_date"),
        "charter_capital": shares * 10_000 if shares and shares > 0 else None,
        "website": first_present(row, "website", "web_url", "website_url", "company_website")
        or OFFICIAL_WEBSITES.get(ticker),
        "description": first_present(row, "company_profile", "description"),
    }


def normalize_period(value):
    """Chuẩn hóa các dạng 2025-Q4, Q4 2025 hoặc 2025Q4."""
    text = str(value).strip().upper()
    match = re.search(r"(20\d{2}).*?Q([1-4])", text)
    if not match:
        match = re.search(r"Q([1-4]).*?(20\d{2})", text)
        return f"{match.group(2)}-Q{match.group(1)}" if match else None
    return f"{match.group(1)}-Q{match.group(2)}"


def parse_period(value):
    normalized = normalize_period(value)
    return (int(normalized[:4]), int(normalized[-1])) if normalized else None


def recent_periods(*frames, limit=4):
    periods = {
        parsed
        for frame in frames
        if frame is not None
        for column in frame.columns
        if (parsed := parse_period(column)) is not None
    }
    return sorted(periods, reverse=True)[:limit]


def quarter_end(year, quarter):
    month = quarter * 3
    return date(year, month, calendar.monthrange(year, month)[1])


def normalize_number(value, metric_code=None):
    if is_missing(value):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    # DECIMAL(20,4) chỉ chứa tối đa 16 chữ số ở phần nguyên.
    if not math.isfinite(number) or abs(number) >= 1e16:
        return None
    return number / 100 if metric_code in PERCENTAGE_METRICS else number


def valid_source_url(value):
    if is_missing(value):
        return None
    text = str(value).strip()
    parsed = urlparse(text)
    return text if parsed.scheme in {"http", "https"} and parsed.netloc else None


def values_for_period(frame, mapping, period, multiplier=1):
    """Lấy metric hợp lệ của một kỳ; một metric chỉ nhận giá trị đầu tiên."""
    if frame is None or frame.empty:
        return {}
    column = next((col for col in frame.columns if parse_period(col) == period), None)
    if column is None:
        return {}
    values = {}
    for _, row in frame.iterrows():
        metric_code = mapping.get(row.get("item_id"))
        if metric_code and metric_code not in values:
            value = normalize_number(row.get(column), metric_code)
            if value is not None:
                scaled = value * multiplier
                if math.isfinite(scaled) and abs(scaled) < 1e16:
                    values[metric_code] = scaled
    return values
