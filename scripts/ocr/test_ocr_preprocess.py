from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pymupdf

from scripts.ocr.ocr_preprocess import (
    CONTROL_PATH,
    OcrError,
    build_summary,
    process_document,
    resolve_roots,
    write_json,
)


def create_text_pdf(path: Path, text: str = "FPT financial report 2026") -> None:
    document = pymupdf.open()
    document.new_page().insert_text((72, 72), text)
    document.save(path)
    document.close()


def create_image_pdf(path: Path) -> None:
    document = pymupdf.open()
    page = document.new_page()
    pixmap = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 10, 10), 0)
    pixmap.clear_with(255)
    page.insert_image(page.rect, pixmap=pixmap)
    document.save(path)
    document.close()


def create_mixed_image_pdf(path: Path) -> None:
    document = pymupdf.open()
    for index in range(3):
        page = document.new_page()
        pixmap = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 10, 10), 0)
        pixmap.clear_with(255)
        page.insert_image(page.rect, pixmap=pixmap)
        text = "1" if index == 1 else "financial report text " * 4
        page.insert_text((72, 72), text)
    document.save(path)
    document.close()


class RootSafetyTests(unittest.TestCase):
    def test_rejects_output_inside_input(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            input_root = Path(directory) / "input"
            input_root.mkdir()
            with self.assertRaises(OcrError) as context:
                resolve_roots(input_root, input_root / "output")
            self.assertEqual(context.exception.code, "OUTPUT_INSIDE_INPUT")


class ProcessingTests(unittest.TestCase):
    def test_control_is_copied_byte_for_byte(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.pdf"
            create_text_pdf(source)
            result = process_document(
                CONTROL_PATH, source, root / "output", root / "work"
            )
            output = root / "output" / Path(CONTROL_PATH)
            self.assertEqual(result["status"], "ready")
            self.assertEqual(result["action"], "copied")
            self.assertEqual(source.read_bytes(), output.read_bytes())

    def test_failed_ocr_does_not_replace_existing_output(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.pdf"
            output = root / "output" / "FPT" / "report.pdf"
            create_text_pdf(source)
            output.parent.mkdir(parents=True)
            output.write_bytes(b"valid-old-output")

            def fail(
                _source: Path,
                _output: Path,
                _mode: str,
                _pages: list[int] | None,
            ) -> None:
                raise OcrError("OCR_FAILED", "expected failure")

            result = process_document(
                "FPT/report.pdf", source, root / "output", root / "work", ocr_runner=fail
            )
            self.assertEqual(result["errorCode"], "OCR_FAILED")
            self.assertEqual(output.read_bytes(), b"valid-old-output")

    def test_falls_back_to_flattened_force_ocr(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.pdf"
            create_image_pdf(source)
            modes: list[str] = []

            def fake_ocr(
                input_path: Path,
                output_path: Path,
                mode: str,
                _pages: list[int] | None,
            ) -> None:
                modes.append(mode)
                if mode == "skip-text":
                    output_path.write_bytes(input_path.read_bytes())
                else:
                    create_text_pdf(output_path)

            result = process_document(
                "FPT/report.pdf",
                source,
                root / "output",
                root / "work",
                ocr_runner=fake_ocr,
            )
            self.assertEqual(modes, ["skip-text", "force-ocr"])
            self.assertEqual(result["status"], "ready")
            self.assertEqual(result["ocrMode"], "force-ocr-after-flatten")

    def test_force_ocrs_sparse_pages_that_skip_text_misses(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.pdf"
            create_mixed_image_pdf(source)
            calls: list[tuple[str, list[int] | None]] = []

            def fake_ocr(
                input_path: Path,
                output_path: Path,
                mode: str,
                pages: list[int] | None,
            ) -> None:
                calls.append((mode, pages))
                if mode == "skip-text":
                    output_path.write_bytes(input_path.read_bytes())
                    return
                with pymupdf.open(input_path) as document:
                    for page_number in pages or []:
                        document[page_number - 1].insert_text(
                            (72, 100), "recovered financial table text " * 3
                        )
                    document.save(output_path)

            result = process_document(
                "FPT/report.pdf",
                source,
                root / "output",
                root / "work",
                ocr_runner=fake_ocr,
            )
            self.assertEqual(calls, [("skip-text", None), ("force-pages", [2])])
            self.assertEqual(result["status"], "ready")
            self.assertEqual(result["forcedPages"], [2])
            self.assertEqual(result["remainingLowTextPages"], [])

    def test_rejects_output_above_r3_size_limit(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.pdf"
            create_text_pdf(source)

            def fake_ocr(
                _input: Path,
                output: Path,
                _mode: str,
                _pages: list[int] | None,
            ) -> None:
                create_text_pdf(output)

            with patch("scripts.ocr.ocr_preprocess.MAX_OUTPUT_BYTES", 1):
                result = process_document(
                    "FPT/report.pdf",
                    source,
                    root / "output",
                    root / "work",
                    ocr_runner=fake_ocr,
                )
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["errorCode"], "OUTPUT_TOO_LARGE")
            self.assertFalse((root / "output" / "FPT" / "report.pdf").exists())

    def test_rerun_reuses_valid_output_without_calling_ocr(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.pdf"
            create_text_pdf(source)
            input_checksum = source.read_bytes()

            def copy_ocr(
                input_path: Path,
                output_path: Path,
                _mode: str,
                _pages: list[int] | None,
            ) -> None:
                output_path.write_bytes(input_path.read_bytes())

            first = process_document(
                "FPT/report.pdf",
                source,
                root / "output",
                root / "work",
                ocr_runner=copy_ocr,
            )

            def unexpected_ocr(
                _input: Path,
                _output: Path,
                _mode: str,
                _pages: list[int] | None,
            ) -> None:
                self.fail("valid output should be reused")

            second = process_document(
                "FPT/report.pdf",
                source,
                root / "output",
                root / "work",
                previous=first,
                ocr_runner=unexpected_ocr,
            )
            self.assertTrue(second["reused"])
            self.assertEqual(first["outputChecksum"], second["outputChecksum"])
            self.assertEqual(input_checksum, source.read_bytes())


class ManifestTests(unittest.TestCase):
    def test_manifest_uses_relative_paths_and_summary_counts(self) -> None:
        files = [
            {"relativePath": "FPT/report.pdf", "action": "ocr", "status": "ready"},
            {"relativePath": CONTROL_PATH, "action": "copied", "status": "failed"},
        ]
        summary = build_summary(files, 1.2345)
        self.assertEqual(
            {key: summary[key] for key in ("ready", "failed", "ocr", "copied")},
            {"ready": 1, "failed": 1, "ocr": 1, "copied": 1},
        )
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manifest.json"
            write_json(path, {"files": files})
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(payload["files"][0]["relativePath"], "FPT/report.pdf")
            self.assertNotIn(str(Path(directory).resolve()), path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
