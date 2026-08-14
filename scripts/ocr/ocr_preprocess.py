from __future__ import annotations

import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Callable, Sequence

import pymupdf


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
AI_SERVICE_ROOT = REPOSITORY_ROOT / "ai-service"
LOCAL_TOOLS = REPOSITORY_ROOT / "runtime" / "ocr" / "tools"
LOCAL_TESSDATA = LOCAL_TOOLS / "tessdata"
LOCAL_PNGQUANT = LOCAL_TOOLS / "pngquant" / "pngquant" / "pngquant.exe"
MAX_OUTPUT_BYTES = 100 * 1024 * 1024
if str(AI_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.ingestion import (  # noqa: E402
    MIN_PAGE_TEXT_CHARS,
    extract_pdf_pages,
    pdf_needs_ocr,
    sha256_file,
)


CONTROL_PATH = "HPG/bctc-hop-nhat-quy-i-2026.pdf"
EXPECTED_PDFS = frozenset(
    {
        "FPT/20251023 - FPT - BCTC hop nhat Quy 3 2025.pdf",
        "FPT/20260126 - FPT - BCTC hop nhat Quy 4 2025.pdf",
        "FPT/20260424 - FPT - BCTC hop nhat Quy 1 nam 2026.pdf",
        "GAS/GAS_Baocaotaichinh_Q1_2026_Hopnhat.pdf",
        "GAS/GAS_Baocaotaichinh_Q3_2025_Hopnhat.pdf",
        "GAS/GAS_Baocaotaichinh_Q4_2025_Hopnhat.pdf",
        "HPG/20251029-hpg-bao-cao-tai-chinh-hop-nhat-quy-iii-2025.pdf",
        "HPG/20260130-hpg-bao-cao-tai-chinh-hop-nhat-va-giai-trinh-q4-2025.pdf",
        CONTROL_PATH,
        "HSG/HSG_Baocaotaichinh_Q1_2026_Hopnhat.pdf",
        "HSG/HSG_Baocaotaichinh_Q2_2026_Hopnhat.pdf",
        "HSG/HSG_Baocaotaichinh_Q4_2025_Hopnhat.pdf",
    }
)


class OcrError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def resolve_roots(input_root: Path, output_root: Path) -> tuple[Path, Path]:
    if not input_root.is_dir():
        raise OcrError("INPUT_ROOT_NOT_FOUND", "Input root does not exist")
    source = input_root.resolve(strict=True)
    output = output_root.resolve()
    if output == source or output.is_relative_to(source):
        raise OcrError("OUTPUT_INSIDE_INPUT", "Output root must be outside input root")
    return source, output


def discover_inventory(input_root: Path) -> dict[str, Path]:
    inventory: dict[str, Path] = {}
    for candidate in input_root.rglob("*"):
        if not candidate.is_file() or candidate.suffix.casefold() != ".pdf":
            continue
        resolved = candidate.resolve(strict=True)
        if not resolved.is_relative_to(input_root):
            raise OcrError("UNEXPECTED_PDF_SET", "A PDF resolves outside input root")
        inventory[candidate.relative_to(input_root).as_posix()] = candidate
    if frozenset(inventory) != EXPECTED_PDFS:
        missing = sorted(EXPECTED_PDFS - inventory.keys())
        extra = sorted(inventory.keys() - EXPECTED_PDFS)
        raise OcrError(
            "UNEXPECTED_PDF_SET",
            f"Expected 12 PDFs; missing={missing}, extra={extra}",
        )
    return inventory


def _find_tesseract() -> str:
    executable = shutil.which("tesseract")
    if executable:
        return executable
    if os.name == "nt":
        for environment_name in ("ProgramFiles", "ProgramFiles(x86)"):
            program_files = os.getenv(environment_name)
            if program_files:
                candidate = Path(program_files) / "Tesseract-OCR" / "tesseract.exe"
                if candidate.is_file():
                    return str(candidate)
    raise OcrError("OCR_RUNTIME_UNAVAILABLE", "Tesseract was not found")


def _find_pngquant() -> str:
    executable = shutil.which("pngquant")
    if executable:
        return executable
    if os.name == "nt" and LOCAL_PNGQUANT.is_file():
        os.environ["PATH"] = f"{LOCAL_PNGQUANT.parent}{os.pathsep}{os.environ['PATH']}"
        return str(LOCAL_PNGQUANT)
    raise OcrError("OCR_RUNTIME_UNAVAILABLE", "pngquant was not found")


def check_runtime() -> dict[str, object]:
    if importlib.util.find_spec("ocrmypdf") is None:
        raise OcrError("OCR_RUNTIME_UNAVAILABLE", "Python package ocrmypdf is missing")

    if LOCAL_TESSDATA.is_dir() and not os.getenv("TESSDATA_PREFIX"):
        os.environ["TESSDATA_PREFIX"] = str(LOCAL_TESSDATA)

    version_result = subprocess.run(
        [sys.executable, "-m", "ocrmypdf", "--version"],
        check=True,
        capture_output=True,
        text=True,
    )
    version = (version_result.stdout or version_result.stderr).strip()
    language_result = subprocess.run(
        [_find_tesseract(), "--list-langs"],
        check=True,
        capture_output=True,
        text=True,
    )
    languages = {
        line.strip()
        for line in language_result.stdout.splitlines()
        if line.strip() and not line.lower().startswith("list of available languages")
    }
    missing = {"vie", "eng"} - languages
    if missing:
        raise OcrError(
            "OCR_LANGUAGE_MISSING", f"Missing Tesseract languages: {sorted(missing)}"
        )
    pngquant_result = subprocess.run(
        [_find_pngquant(), "--version"],
        check=True,
        capture_output=True,
        text=True,
    )
    return {
        "ocrmypdfVersion": version,
        "pngquantVersion": pngquant_result.stdout.strip(),
        "languages": sorted({"vie", "eng"}),
        "outputType": "pdf",
        "optimization": {"skipText": 0, "forceOcrFallback": 3},
        "mode": "skip-text with flattened force-ocr fallback",
    }


def inspect_pdf(path: Path) -> tuple[int, bool]:
    try:
        pages = extract_pdf_pages(path)
        return len(pages), not pdf_needs_ocr(pages)
    except Exception as error:
        raise OcrError("PDF_OPEN_FAILED", "PDF could not be inspected") from error


def low_text_image_pages(path: Path) -> list[int]:
    try:
        return [
            page.page_number
            for page in extract_pdf_pages(path)
            if page.has_images and len(page.text) < MIN_PAGE_TEXT_CHARS
        ]
    except Exception as error:
        raise OcrError("PDF_OPEN_FAILED", "PDF text quality could not be inspected") from error


def run_ocr(
    source: Path,
    temporary_output: Path,
    mode: str = "skip-text",
    pages: Sequence[int] | None = None,
) -> None:
    mode_flag = "--force-ocr" if mode == "force-ocr" else "--skip-text"
    optimize = "3" if mode == "force-ocr" else "0"
    if mode == "force-pages":
        if not pages:
            raise OcrError("OCR_FAILED", "force-pages requires at least one page")
        mode_flag = "--force-ocr"
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
            optimize,
            mode_flag,
            "--invalidate-digital-signatures",
            "--jobs",
            "1",
            *(["--pages", ",".join(map(str, pages))] if pages else []),
            str(source),
            str(temporary_output),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        message = (result.stderr or result.stdout or "OCRmyPDF failed").strip()
        raise OcrError("OCR_FAILED", message[-1000:])


def _publish(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.replace(source, destination)
    except OSError as error:
        raise OcrError("OUTPUT_PUBLISH_FAILED", str(error)) from error


def _ready_existing_output(
    relative_path: str,
    input_checksum: str,
    output_path: Path,
    previous: dict[str, object] | None,
) -> dict[str, object] | None:
    if (
        not previous
        or previous.get("status") != "ready"
        or previous.get("inputChecksum") != input_checksum
        or previous.get("ocrMode") == "force-ocr"
        or not output_path.is_file()
        or output_path.stat().st_size > MAX_OUTPUT_BYTES
    ):
        return None
    page_count, text_ready = inspect_pdf(output_path)
    low_pages = low_text_image_pages(output_path)
    output_checksum = sha256_file(output_path)
    if previous.get("action") == "copied":
        text_ready = output_checksum == input_checksum
    if not text_ready or page_count != previous.get("pageCountAfter"):
        return None
    if low_pages and previous.get("ocrMode") == "skip-text":
        return None
    return {
        **previous,
        "relativePath": relative_path,
        "outputChecksum": output_checksum,
        "outputBytes": output_path.stat().st_size,
        "forcedPages": previous.get("forcedPages", []),
        "remainingLowTextPages": low_pages,
        "textLayerReady": True,
        "errorCode": None,
        "reused": True,
    }


def process_document(
    relative_path: str,
    source: Path,
    output_root: Path,
    work_root: Path,
    previous: dict[str, object] | None = None,
    ocr_runner: Callable[[Path, Path, str, Sequence[int] | None], None] = run_ocr,
) -> dict[str, object]:
    action = "copied" if relative_path == CONTROL_PATH else "ocr"
    input_checksum = sha256_file(source)
    page_count_before, _ = inspect_pdf(source)
    destination = output_root / Path(relative_path)
    existing = _ready_existing_output(
        relative_path, input_checksum, destination, previous
    )
    if existing:
        return {**existing, "inputBytes": source.stat().st_size}

    work_root.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix="ocr-", suffix=".pdf", dir=work_root
    )
    os.close(descriptor)
    temporary = Path(temporary_name)
    temporary.unlink(missing_ok=True)
    flattened_sources: list[Path] = []
    mode_used: str | None = None
    forced_pages: list[int] = []
    try:
        if action == "copied":
            shutil.copyfile(source, temporary)
        else:
            mode_used = "skip-text"
            ocr_runner(source, temporary, mode_used, None)
        if sha256_file(source) != input_checksum:
            raise OcrError("INPUT_CHANGED_DURING_RUN", "Input checksum changed")
        page_count_after, text_ready = inspect_pdf(temporary)
        if action == "ocr" and not text_ready:
            temporary.unlink(missing_ok=True)
            mode_used = "force-ocr-after-flatten"
            flattened_source = work_root / f"flattened-{temporary.name}"
            flattened_sources.append(flattened_source)
            try:
                with pymupdf.open(source) as document:
                    document.bake(annots=True, widgets=True)
                    document.save(flattened_source)
            except Exception as error:
                raise OcrError(
                    "PDF_FLATTEN_FAILED", "PDF annotations could not be flattened"
                ) from error
            ocr_runner(flattened_source, temporary, "force-ocr", None)
            page_count_after, text_ready = inspect_pdf(temporary)
            if sha256_file(source) != input_checksum:
                raise OcrError("INPUT_CHANGED_DURING_RUN", "Input checksum changed")
        if action == "ocr":
            forced_pages = low_text_image_pages(temporary)
            if forced_pages:
                flattened_output = work_root / f"quality-flattened-{temporary.name}"
                flattened_sources.append(flattened_output)
                try:
                    with pymupdf.open(temporary) as document:
                        document.bake(annots=True, widgets=True)
                        document.save(flattened_output)
                except Exception as error:
                    raise OcrError(
                        "PDF_FLATTEN_FAILED",
                        "OCR output annotations could not be flattened",
                    ) from error
                temporary.unlink(missing_ok=True)
                ocr_runner(flattened_output, temporary, "force-pages", forced_pages)
                mode_used = f"{mode_used}+force-low-text-pages"
                page_count_after, text_ready = inspect_pdf(temporary)
        if page_count_after != page_count_before:
            raise OcrError("PAGE_COUNT_CHANGED", "Page count changed during OCR")
        if sha256_file(source) != input_checksum:
            raise OcrError("INPUT_CHANGED_DURING_RUN", "Input checksum changed")
        remaining_low_text_pages = (
            low_text_image_pages(temporary) if action == "ocr" else []
        )
        output_checksum = sha256_file(temporary)
        if action == "copied" and output_checksum != input_checksum:
            raise OcrError("CONTROL_CHECKSUM_CHANGED", "Control checksum changed")
        if not text_ready:
            raise OcrError("TEXT_LAYER_NOT_READY", "Output still requires OCR")
        output_bytes = temporary.stat().st_size
        if output_bytes > MAX_OUTPUT_BYTES:
            raise OcrError(
                "OUTPUT_TOO_LARGE", "Output exceeds the unchanged 100 MB R3 limit"
            )
        _publish(temporary, destination)
        return {
            "relativePath": relative_path,
            "action": action,
            "ocrMode": mode_used,
            "status": "ready",
            "inputChecksum": input_checksum,
            "inputBytes": source.stat().st_size,
            "outputChecksum": output_checksum,
            "outputBytes": output_bytes,
            "forcedPages": forced_pages,
            "remainingLowTextPages": remaining_low_text_pages,
            "pageCountBefore": page_count_before,
            "pageCountAfter": page_count_after,
            "textLayerReady": True,
            "errorCode": None,
            "reused": False,
        }
    except OcrError as error:
        safe_message = str(error)
        for path, replacement in (
            (source, "<input>"),
            (work_root, "<work>"),
            (output_root, "<output>"),
            (REPOSITORY_ROOT, "<repository>"),
            (Path.home(), "<home>"),
        ):
            safe_message = safe_message.replace(str(path), replacement)
        return {
            "relativePath": relative_path,
            "action": action,
            "ocrMode": mode_used,
            "status": "failed",
            "inputChecksum": input_checksum,
            "inputBytes": source.stat().st_size,
            "outputChecksum": None,
            "pageCountBefore": page_count_before,
            "pageCountAfter": None,
            "textLayerReady": False,
            "errorCode": error.code,
            "errorMessage": safe_message,
            "reused": False,
        }
    finally:
        temporary.unlink(missing_ok=True)
        for flattened_source in flattened_sources:
            flattened_source.unlink(missing_ok=True)


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, path)


def load_previous_manifest(path: Path) -> dict[str, dict[str, object]]:
    if not path.is_file():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return {str(item["relativePath"]): item for item in payload.get("files", [])}
    except (KeyError, TypeError, ValueError):
        return {}


def build_summary(files: Sequence[dict[str, object]], elapsed: float) -> dict[str, object]:
    reused = sum(bool(item.get("reused")) for item in files)
    return {
        "discovered": len(files),
        "ready": sum(item["status"] == "ready" for item in files),
        "failed": sum(item["status"] == "failed" for item in files),
        "ocr": sum(item["action"] == "ocr" for item in files),
        "copied": sum(item["action"] == "copied" for item in files),
        "runtimeSeconds": round(elapsed, 3),
        "inputBytes": sum(int(item.get("inputBytes") or 0) for item in files),
        "outputBytes": sum(int(item.get("outputBytes") or 0) for item in files),
        "processed": len(files) - reused,
        "reused": reused,
    }


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create searchable WikiStock PDFs")
    parser.add_argument("--input-root", type=Path)
    parser.add_argument("--output-root", type=Path)
    parser.add_argument("--only", choices=sorted(EXPECTED_PDFS))
    parser.add_argument("--check-runtime", action="store_true")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        runtime = check_runtime()
        if args.check_runtime:
            print(json.dumps(runtime, sort_keys=True))
            return 0
        if args.input_root is None or args.output_root is None:
            raise OcrError(
                "INPUT_ROOT_NOT_FOUND",
                "--input-root and --output-root are required unless --check-runtime is used",
            )
        input_root, output_root = resolve_roots(args.input_root, args.output_root)
        inventory = discover_inventory(input_root)
        selected = [args.only] if args.only else sorted(inventory)
        manifest_path = output_root.parent / "manifest.json"
        summary_path = output_root.parent / "summary.json"
        previous = load_previous_manifest(manifest_path)
        manifest_entries = dict(previous)
        started = time.monotonic()
        files: list[dict[str, object]] = []
        for relative_path in selected:
            result = process_document(
                relative_path,
                inventory[relative_path],
                output_root,
                output_root.parent / "work",
                previous.get(relative_path),
            )
            files.append(result)
            manifest_entries[relative_path] = result
            write_json(
                manifest_path,
                {
                    "runtime": runtime,
                    "files": [
                        manifest_entries[path] for path in sorted(manifest_entries)
                    ],
                },
            )
            print(json.dumps(result, ensure_ascii=False, sort_keys=True))
        summary = build_summary(files, time.monotonic() - started)
        write_json(summary_path, summary)
        print(json.dumps({"summary": summary}, sort_keys=True))
        return 1 if summary["failed"] else 0
    except (OcrError, subprocess.SubprocessError) as error:
        code = error.code if isinstance(error, OcrError) else "OCR_RUNTIME_UNAVAILABLE"
        print(json.dumps({"status": "failed", "errorCode": code, "message": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
