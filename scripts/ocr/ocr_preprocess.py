from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pymupdf


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
AI_SERVICE_ROOT = REPOSITORY_ROOT / "ai-service"
LOCAL_TESSDATA = REPOSITORY_ROOT / "runtime" / "ocr" / "tools" / "tessdata"
if str(AI_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.ingestion import extract_pdf_pages, pdf_needs_ocr, sha256_file  # noqa: E402


class OcrError(Exception):
    pass


def find_tesseract() -> str:
    executable = shutil.which("tesseract")
    if executable:
        return executable
    if os.name == "nt":
        candidate = Path(os.environ["ProgramFiles"]) / "Tesseract-OCR" / "tesseract.exe"
        if candidate.is_file():
            return str(candidate)
    raise OcrError("Tesseract was not found")


def check_runtime() -> None:
    if LOCAL_TESSDATA.is_dir() and not os.getenv("TESSDATA_PREFIX"):
        os.environ["TESSDATA_PREFIX"] = str(LOCAL_TESSDATA)
    subprocess.run(
        [sys.executable, "-m", "ocrmypdf", "--version"],
        check=True,
        capture_output=True,
        text=True,
    )
    result = subprocess.run(
        [find_tesseract(), "--list-langs"],
        check=True,
        capture_output=True,
        text=True,
    )
    languages = set(result.stdout.splitlines())
    if not {"vie", "eng"}.issubset(languages):
        raise OcrError("Tesseract requires vie and eng language data")


def inspect_pdf(path: Path) -> tuple[int, bool]:
    pages = extract_pdf_pages(path)
    return len(pages), not pdf_needs_ocr(pages)


def run_ocr(source: Path, output: Path, force: bool = False) -> None:
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "ocrmypdf",
            "--language",
            "vie+eng",
            "--output-type",
            "pdf",
            "--optimize",
            "0",
            "--force-ocr" if force else "--skip-text",
            "--invalidate-digital-signatures",
            "--jobs",
            "1",
            str(source),
            str(output),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise OcrError((result.stderr or result.stdout)[-1000:])


def main() -> int:
    parser = argparse.ArgumentParser(description="Create one searchable pilot PDF")
    parser.add_argument("--input-root", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--only", required=True)
    args = parser.parse_args()

    check_runtime()
    source_root = args.input_root.resolve(strict=True)
    output_root = args.output_root.resolve()
    if output_root == source_root or output_root.is_relative_to(source_root):
        raise OcrError("Output root must be outside input root")

    source = source_root / args.only
    if not source.is_file() or source.suffix.casefold() != ".pdf":
        raise OcrError("Pilot PDF does not exist")
    destination = output_root / args.only
    input_checksum = sha256_file(source)
    page_count_before, _ = inspect_pdf(source)
    work_root = output_root.parent / "work"
    work_root.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix="ocr-pilot-", suffix=".pdf", dir=work_root
    )
    os.close(descriptor)
    temporary = Path(temporary_name)
    temporary.unlink(missing_ok=True)
    flattened = work_root / f"flattened-{temporary.name}"
    try:
        run_ocr(source, temporary)
        page_count_after, text_ready = inspect_pdf(temporary)
        mode = "skip-text"
        if not text_ready:
            temporary.unlink(missing_ok=True)
            with pymupdf.open(source) as document:
                document.bake(annots=True, widgets=True)
                document.save(flattened)
            run_ocr(flattened, temporary, force=True)
            page_count_after, text_ready = inspect_pdf(temporary)
            mode = "force-ocr-after-flatten"
        if sha256_file(source) != input_checksum:
            raise OcrError("Input checksum changed")
        if page_count_after != page_count_before:
            raise OcrError("Page count changed")
        if not text_ready:
            raise OcrError("Output still requires OCR")
        destination.parent.mkdir(parents=True, exist_ok=True)
        os.replace(temporary, destination)
        print(
            json.dumps(
                {
                    "relativePath": args.only,
                    "status": "ready",
                    "ocrMode": mode,
                    "inputChecksum": input_checksum,
                    "outputChecksum": sha256_file(destination),
                    "pageCountBefore": page_count_before,
                    "pageCountAfter": page_count_after,
                },
                sort_keys=True,
            )
        )
        return 0
    finally:
        temporary.unlink(missing_ok=True)
        flattened.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
