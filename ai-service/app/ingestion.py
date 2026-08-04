from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from dataclasses import asdict
from pathlib import Path
from typing import Iterable, Sequence

import pymupdf

from app.config import IngestionSettings
from app.models import DocumentChunk, DocumentMetadata, Issue, PageText


KNOWN_COMPANY_CODES = frozenset({"FPT", "GAS", "HPG", "HSG"})
MIN_PAGE_TEXT_CHARS = 40
_ROMAN_QUARTERS = {"i": 1, "ii": 2, "iii": 3, "iv": 4}
_REPORT_PERIOD_PATTERNS = (
    re.compile(r"(?:^|[^a-z0-9])q([1-4])[-_ ]+(20\d{2})(?:[^0-9]|$)"),
    re.compile(
        r"(?:^|[^a-z0-9])quy[-_ ]+([1-4]|iv|iii|ii|i)"
        r"(?:[-_ ]+nam)?[-_ ]+(20\d{2})(?:[^0-9]|$)"
    ),
)


class IngestionError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def _relative_display(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.name


def discover_pdf_paths(
    seed_root: Path, max_pdf_size_mb: int
) -> tuple[list[Path], list[dict[str, object]]]:
    if not seed_root.exists() or not seed_root.is_dir():
        raise IngestionError(
            "SEED_PATH_NOT_FOUND", f"Seed directory does not exist: {seed_root}"
        )

    root = seed_root.resolve(strict=True)
    max_bytes = max_pdf_size_mb * 1024 * 1024
    paths: list[Path] = []
    rejected: list[dict[str, object]] = []

    for candidate in seed_root.rglob("*"):
        if candidate.suffix.casefold() != ".pdf" or not candidate.is_file():
            continue
        display_path = _relative_display(candidate, seed_root)
        resolved = candidate.resolve(strict=True)
        try:
            resolved.relative_to(root)
        except ValueError:
            rejected.append(
                _failed_result(
                    display_path,
                    "PATH_OUTSIDE_SEED_ROOT",
                    "Resolved PDF path is outside the configured seed directory",
                )
            )
            continue
        if resolved.stat().st_size > max_bytes:
            rejected.append(
                _failed_result(
                    display_path,
                    "PDF_TOO_LARGE",
                    f"PDF exceeds the {max_pdf_size_mb} MB limit",
                )
            )
            continue
        paths.append(candidate)

    paths.sort(key=lambda path: _relative_display(path, seed_root).casefold())
    rejected.sort(key=lambda result: str(result["path"]).casefold())
    return paths, rejected


def _ascii_filename(filename: str) -> str:
    decomposed = unicodedata.normalize("NFKD", filename)
    return "".join(char for char in decomposed if not unicodedata.combining(char)).lower()


def parse_document_metadata(
    path: Path,
    seed_root: Path,
    known_company_codes: frozenset[str] = KNOWN_COMPANY_CODES,
) -> DocumentMetadata:
    try:
        relative_path = path.relative_to(seed_root)
    except ValueError as error:
        raise IngestionError(
            "PATH_OUTSIDE_SEED_ROOT", "PDF path is outside the configured seed directory"
        ) from error
    if len(relative_path.parts) < 2:
        raise IngestionError(
            "UNKNOWN_COMPANY_CODE", "PDF must be stored under a ticker directory"
        )

    company_code = relative_path.parts[0].upper()
    if company_code not in known_company_codes:
        raise IngestionError(
            "UNKNOWN_COMPANY_CODE", f"Unknown ticker directory: {relative_path.parts[0]}"
        )

    normalized_name = _ascii_filename(path.stem)
    for pattern in _REPORT_PERIOD_PATTERNS:
        match = pattern.search(normalized_name)
        if match:
            raw_quarter, raw_year = match.groups()
            quarter = (
                int(raw_quarter)
                if raw_quarter.isdigit()
                else _ROMAN_QUARTERS[raw_quarter]
            )
            return DocumentMetadata(company_code, int(raw_year), quarter)

    return DocumentMetadata(
        company_code,
        None,
        None,
        (
            Issue(
                "UNPARSED_REPORT_PERIOD",
                "Could not parse fiscal quarter and year from the filename",
            ),
        ),
    )


def sha256_file(path: Path, block_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file_handle:
        while block := file_handle.read(block_size):
            digest.update(block)
    return digest.hexdigest()


def normalize_block(text: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", text)).strip()


def extract_pdf_pages(path: Path) -> list[PageText]:
    try:
        with pymupdf.open(path) as document:
            pages: list[PageText] = []
            for page_index, page in enumerate(document):
                blocks = tuple(
                    normalized
                    for block in page.get_text("blocks", sort=True)
                    if len(block) < 7 or block[6] == 0
                    if (normalized := normalize_block(str(block[4])))
                )
                pages.append(
                    PageText(
                        page_number=page_index + 1,
                        blocks=blocks,
                        text="\n".join(blocks),
                        has_images=bool(page.get_images(full=True)),
                    )
                )
            return pages
    except (pymupdf.FileDataError, RuntimeError, ValueError) as error:
        raise IngestionError("PDF_PARSE_FAILED", f"Could not parse PDF: {error}") from error


def pdf_needs_ocr(
    pages: Sequence[PageText], min_page_text_chars: int = MIN_PAGE_TEXT_CHARS
) -> bool:
    if not pages:
        return False
    low_text_image_pages = sum(
        page.has_images and len(page.text) < min_page_text_chars for page in pages
    )
    return low_text_image_pages > len(pages) / 2


def _preferred_chunk_end(text: str, start: int, hard_end: int) -> int:
    if hard_end == len(text):
        return hard_end
    minimum_end = start + max(1, (hard_end - start) // 2)
    block_end = text.rfind("\n", minimum_end, hard_end + 1)
    if block_end > start:
        return block_end
    sentence_ends = list(re.finditer(r"[.!?](?:\s+|$)", text[minimum_end:hard_end]))
    if sentence_ends:
        return minimum_end + sentence_ends[-1].end()
    return hard_end


def chunk_pages(
    pages: Iterable[PageText], chunk_size_chars: int, overlap_chars: int
) -> list[DocumentChunk]:
    if chunk_size_chars <= 0:
        raise ValueError("chunk_size_chars must be greater than zero")
    if not 0 <= overlap_chars < chunk_size_chars:
        raise ValueError("overlap_chars must be smaller than chunk_size_chars")

    chunks: list[DocumentChunk] = []
    for page in pages:
        text = page.text.strip()
        start = 0
        while start < len(text):
            hard_end = min(start + chunk_size_chars, len(text))
            end = _preferred_chunk_end(text, start, hard_end)
            content = text[start:end].strip()
            if content:
                chunks.append(
                    DocumentChunk(
                        chunk_index=len(chunks),
                        page_number=page.page_number,
                        location_ref=f"Trang {page.page_number}",
                        content=content,
                        char_count=len(content),
                        content_hash=hashlib.sha256(content.encode("utf-8")).hexdigest(),
                    )
                )
            if end >= len(text):
                break
            next_start = max(start + 1, end - overlap_chars)
            while next_start < end and text[next_start].isspace():
                next_start += 1
            start = next_start
    return chunks


def _failed_result(path: str, code: str, message: str) -> dict[str, object]:
    return {
        "path": path,
        "companyCode": None,
        "fiscalYear": None,
        "fiscalQuarter": None,
        "checksum": None,
        "pageCount": 0,
        "chunkCount": 0,
        "status": "failed",
        "issues": [asdict(Issue(code, message))],
    }


def preflight_document(
    path: Path, seed_root: Path, settings: IngestionSettings
) -> dict[str, object]:
    display_path = _relative_display(path, seed_root)
    try:
        metadata = parse_document_metadata(path, seed_root)
        checksum = sha256_file(path)
        pages = extract_pdf_pages(path)
        if pdf_needs_ocr(pages):
            return {
                **_failed_result(
                    display_path,
                    "PDF_NEEDS_OCR",
                    "Most pages contain images but too little extractable text",
                ),
                "companyCode": metadata.company_code,
                "fiscalYear": metadata.fiscal_year,
                "fiscalQuarter": metadata.fiscal_quarter,
                "checksum": checksum,
                "pageCount": len(pages),
                "status": "needs_ocr",
            }
        chunks = chunk_pages(
            pages, settings.chunk_size_chars, settings.chunk_overlap_chars
        )
        if not chunks:
            raise IngestionError("PDF_PARSE_FAILED", "PDF has no extractable text")
        return {
            "path": display_path,
            "companyCode": metadata.company_code,
            "fiscalYear": metadata.fiscal_year,
            "fiscalQuarter": metadata.fiscal_quarter,
            "checksum": checksum,
            "pageCount": len(pages),
            "chunkCount": len(chunks),
            "status": "ready_for_ingestion",
            "issues": [asdict(issue) for issue in metadata.issues],
        }
    except IngestionError as error:
        return _failed_result(display_path, error.code, str(error))


def scan(settings: IngestionSettings) -> tuple[list[dict[str, object]], int]:
    paths, results = discover_pdf_paths(
        settings.seed_data_path, settings.max_pdf_size_mb
    )
    results.extend(
        preflight_document(path, settings.seed_data_path, settings) for path in paths
    )
    results.sort(key=lambda result: str(result["path"]).casefold())
    failed = sum(result["status"] not in {"ready_for_ingestion"} for result in results)
    return results, failed


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="WikiStock PDF ingestion preflight")
    subparsers = parser.add_subparsers(dest="command", required=True)
    scan_parser = subparsers.add_parser("scan", help="scan configured seed PDFs")
    scan_parser.add_argument("--dry-run", action="store_true")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.command != "scan" or not args.dry_run:
        print("R3 only supports: scan --dry-run", file=sys.stderr)
        return 2
    try:
        results, failed = scan(IngestionSettings.from_env())
    except (IngestionError, ValueError) as error:
        code = error.code if isinstance(error, IngestionError) else "INVALID_CONFIG"
        print(json.dumps({"status": "failed", "code": code, "message": str(error)}))
        return 1

    for result in results:
        print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    print(
        json.dumps(
            {
                "summary": {
                    "discovered": len(results),
                    "ready": len(results) - failed,
                    "failed": failed,
                    "dryRun": True,
                }
            },
            sort_keys=True,
        )
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
