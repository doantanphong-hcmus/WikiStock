"""Liên kết bài RSS với doanh nghiệp bằng các luật xác định trước."""

import re
import unicodedata
from dataclasses import dataclass

from company_aliases import COMPANY_ALIASES, FINANCIAL_CONTEXTS


@dataclass(frozen=True)
class CompanyMatch:
    ticker: str
    relevance_score: float
    rule: str


def _normalize(value, *, fold=False):
    if not isinstance(value, str):
        return ""
    text = " ".join(unicodedata.normalize("NFC", value).split())
    return text.casefold() if fold else text


def _contains_phrase(text, phrase):
    # Ranh giới từ ngăn FPT khớp nhầm với FPTX hoặc chuỗi dài hơn.
    words = re.escape(_normalize(phrase, fold=True)).replace(r"\ ", r"\s+")
    return re.search(rf"(?<!\w){words}(?!\w)", text) is not None


def _contains_ticker(text, ticker):
    return re.search(rf"(?<!\w){re.escape(ticker)}(?!\w)", text) is not None


def match_companies(title, summary=None):
    """Trả mọi doanh nghiệp đủ bằng chứng, ưu tiên độ chính xác hơn số lượng."""
    original_title = _normalize(title)
    folded_title = original_title.casefold()
    folded_summary = _normalize(summary, fold=True)
    has_financial_context = any(
        _contains_phrase(folded_title, context) for context in FINANCIAL_CONTEXTS
    )
    matches = []

    for ticker, aliases in COMPANY_ALIASES.items():
        if any(_contains_phrase(folded_title, alias) for alias in aliases):
            matches.append(CompanyMatch(ticker, 1.0, "strong_alias_title"))
        elif any(_contains_phrase(folded_summary, alias) for alias in aliases):
            matches.append(CompanyMatch(ticker, 0.85, "strong_alias_summary"))
        elif has_financial_context and _contains_ticker(original_title, ticker):
            matches.append(CompanyMatch(ticker, 0.8, "ticker_with_financial_context"))

    return tuple(matches)
