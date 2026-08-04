from __future__ import annotations

from dataclasses import dataclass


class IngestionError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class Issue:
    code: str
    message: str


@dataclass(frozen=True)
class DocumentMetadata:
    company_code: str
    fiscal_year: int | None
    fiscal_quarter: int | None
    issues: tuple[Issue, ...] = ()


@dataclass(frozen=True)
class PageText:
    page_number: int
    blocks: tuple[str, ...]
    text: str
    has_images: bool = False


@dataclass(frozen=True)
class DocumentChunk:
    chunk_index: int
    page_number: int
    location_ref: str
    content: str
    char_count: int
    content_hash: str
