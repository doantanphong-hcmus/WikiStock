from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pymupdf

from app.config import IngestionSettings
from app.ingestion import (
    IngestionError,
    chunk_pages,
    discover_pdf_paths,
    extract_pdf_pages,
    ingest,
    parse_document_metadata,
    pdf_needs_ocr,
    sha256_file,
)
from app.models import PageText


class DiscoveryTests(unittest.TestCase):
    def test_discovers_recursive_pdf_case_insensitively_in_stable_order(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "FPT" / "nested").mkdir(parents=True)
            (root / "FPT" / "z.PDF").write_bytes(b"z")
            (root / "FPT" / "nested" / "a.pdf").write_bytes(b"a")
            (root / "FPT" / "ignore.txt").write_text("ignore", encoding="utf-8")

            paths, rejected = discover_pdf_paths(root, 100)

            self.assertEqual(rejected, [])
            self.assertEqual(
                [path.relative_to(root).as_posix() for path in paths],
                ["FPT/nested/a.pdf", "FPT/z.PDF"],
            )

    def test_rejects_symlink_escape(self) -> None:
        with tempfile.TemporaryDirectory() as root_directory, tempfile.TemporaryDirectory() as outside_directory:
            root = Path(root_directory)
            outside = Path(outside_directory) / "outside.pdf"
            outside.write_bytes(b"outside")
            (root / "FPT").mkdir()
            link = root / "FPT" / "escape.pdf"
            try:
                os.symlink(outside, link)
            except OSError as error:
                self.skipTest(f"Symlinks are unavailable: {error}")

            paths, rejected = discover_pdf_paths(root, 100)

            self.assertEqual(paths, [])
            self.assertEqual(rejected[0]["issues"][0]["code"], "PATH_OUTSIDE_SEED_ROOT")


class MetadataTests(unittest.TestCase):
    def test_parses_all_current_filename_patterns(self) -> None:
        cases = (
            ("FPT/20260424 - FPT - BCTC hop nhat Quy 1 nam 2026.pdf", 2026, 1),
            ("GAS/GAS_Baocaotaichinh_Q4_2025_Hopnhat.pdf", 2025, 4),
            ("HPG/20251029-hpg-bao-cao-tai-chinh-hop-nhat-quy-iii-2025.pdf", 2025, 3),
            ("HPG/bctc-hop-nhat-quy-i-2026.pdf", 2026, 1),
            ("HSG/HSG_Baocaotaichinh_Q2_2026_Hopnhat.pdf", 2026, 2),
        )
        root = Path("seed")
        for relative_path, year, quarter in cases:
            with self.subTest(relative_path=relative_path):
                metadata = parse_document_metadata(root / relative_path, root)
                self.assertEqual((metadata.fiscal_year, metadata.fiscal_quarter), (year, quarter))

    def test_unknown_ticker_fails_closed(self) -> None:
        with self.assertRaises(IngestionError) as context:
            parse_document_metadata(Path("seed/UNKNOWN/report_Q1_2026.pdf"), Path("seed"))
        self.assertEqual(context.exception.code, "UNKNOWN_COMPANY_CODE")

    def test_unparsed_period_returns_warning(self) -> None:
        metadata = parse_document_metadata(Path("seed/FPT/report.pdf"), Path("seed"))
        self.assertIsNone(metadata.fiscal_year)
        self.assertIsNone(metadata.fiscal_quarter)
        self.assertEqual(metadata.issues[0].code, "UNPARSED_REPORT_PERIOD")


class ExtractionAndChunkingTests(unittest.TestCase):
    def test_extracts_text_by_page_and_streams_checksum(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.pdf"
            document = pymupdf.open()
            document.new_page().insert_text((72, 72), "Page one revenue 1.234")
            document.new_page().insert_text((72, 72), "Page two profit -50")
            document.save(path)
            document.close()

            pages = extract_pdf_pages(path)

            self.assertEqual([page.page_number for page in pages], [1, 2])
            self.assertIn("1.234", pages[0].text)
            self.assertIn("-50", pages[1].text)
            self.assertEqual(len(sha256_file(path)), 64)

    def test_chunks_are_page_bound_and_deterministic(self) -> None:
        pages = [
            PageText(1, ("PAGE_ONE " * 20,), "PAGE_ONE " * 20),
            PageText(2, ("PAGE_TWO " * 20,), "PAGE_TWO " * 20),
        ]

        first = chunk_pages(pages, chunk_size_chars=50, overlap_chars=10)
        second = chunk_pages(pages, chunk_size_chars=50, overlap_chars=10)

        self.assertEqual(first, second)
        self.assertGreater(len(first), 2)
        for chunk in first:
            self.assertTrue(chunk.content.strip())
            self.assertLessEqual(chunk.char_count, 50)
            self.assertEqual(chunk.location_ref, f"Trang {chunk.page_number}")
            self.assertEqual(len(chunk.content_hash), 64)
            self.assertFalse("PAGE_ONE" in chunk.content and "PAGE_TWO" in chunk.content)

    def test_long_block_splits_with_bounded_overlap(self) -> None:
        page = PageText(1, ("x" * 95,), "x" * 95)
        chunks = chunk_pages([page], chunk_size_chars=40, overlap_chars=5)
        self.assertEqual([chunk.char_count for chunk in chunks], [40, 40, 25])
        self.assertEqual(chunks[0].content[-5:], chunks[1].content[:5])

    def test_detects_image_heavy_low_text_pdf(self) -> None:
        pages = [
            PageText(1, (), "", True),
            PageText(2, (), "tiny", True),
            PageText(3, ("enough text " * 10,), "enough text " * 10, False),
        ]
        self.assertTrue(pdf_needs_ocr(pages))


class SettingsTests(unittest.TestCase):
    def test_overlap_must_be_smaller_than_chunk_size(self) -> None:
        with self.assertRaises(ValueError):
            IngestionSettings(Path("seed"), chunk_size_chars=100, chunk_overlap_chars=100)


class IngestionOutcomeTests(unittest.TestCase):
    def test_needs_ocr_makes_the_batch_fail(self) -> None:
        class DatabaseStub:
            @staticmethod
            def document_state(_checksum):
                return None

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ticker_directory = root / "FPT"
            ticker_directory.mkdir()
            (ticker_directory / "report_Q1_2026.pdf").write_bytes(b"pdf")
            image_page = PageText(1, (), "", True)

            with patch("app.ingestion.extract_pdf_pages", return_value=[image_page]):
                results, failed = ingest(
                    IngestionSettings(root), database=DatabaseStub()
                )

        self.assertEqual(results[0]["status"], "needs_ocr")
        self.assertEqual(failed, 1)


if __name__ == "__main__":
    unittest.main()
