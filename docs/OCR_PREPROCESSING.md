# OCR preprocessing

This tool creates a separate searchable-PDF seed root for the RAG ingestion pipeline. It never modifies the 12 source PDFs and does not use Claude or any cloud OCR API.

## Runtime

Required:

- Python 3.12 64-bit.
- OCRmyPDF 17.8.1.
- Tesseract with `vie` and `eng` language data.
- pngquant (required by the fallback compression for GAS reports).
- The existing `ai-service` Python requirements, used by the R3 acceptance oracle.

Native Windows installation follows the official OCRmyPDF requirements: Python, Tesseract and OCRmyPDF. The Docker image is the reproducible Codespaces runtime.

On this project machine, the Tesseract executable is installed in its standard Windows location. The project-local `runtime/ocr/tools/tessdata/` supplies `eng` and `vie` without modifying the system installation; the runner detects it automatically. pngquant may be installed on `PATH`, or its official Windows archive may be extracted to `runtime/ocr/tools/pngquant/`:

```powershell
New-Item -ItemType Directory -Force runtime\ocr\tools | Out-Null
Invoke-WebRequest https://pngquant.org/pngquant-windows.zip `
  -OutFile runtime\ocr\tools\pngquant-windows.zip
$expected = "BD0257AEECCFE446A4CD764927E26F8AF6051796F28ABED104307284107B120D"
$actual = (Get-FileHash runtime\ocr\tools\pngquant-windows.zip -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw "Unexpected pngquant archive checksum" }
Expand-Archive runtime\ocr\tools\pngquant-windows.zip runtime\ocr\tools\pngquant
```

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ai-service\requirements.txt
.\.venv\Scripts\python.exe -m pip install ocrmypdf==17.8.1
.\.venv\Scripts\python.exe scripts\ocr\ocr_preprocess.py --check-runtime
```

```bash
docker build -f scripts/ocr/Dockerfile -t wikistock-ocr:17.8.1 .
docker run --rm --entrypoint python wikistock-ocr:17.8.1 -m ocrmypdf --version
docker run --rm --entrypoint tesseract wikistock-ocr:17.8.1 --list-langs
docker run --rm --entrypoint pngquant wikistock-ocr:17.8.1 --version
```

In Codespaces, run the batch with the repository mounted at `/workspace`:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -v "$PWD:/workspace" -w /workspace --entrypoint python \
  wikistock-ocr:17.8.1 scripts/ocr/ocr_preprocess.py \
  --input-root "docs/Seed_Daa/Báo cáo tài chính" \
  --output-root "runtime/ocr/output"
```

## Pilot

Run the 32-page HSG Q2/2026 pilot first:

```powershell
.\.venv\Scripts\python.exe scripts\ocr\ocr_preprocess.py `
  --input-root "docs\Seed_Daa\Báo cáo tài chính" `
  --output-root "runtime\ocr\output" `
  --only "HSG/HSG_Baocaotaichinh_Q2_2026_Hopnhat.pdf"
```

## Full batch

```powershell
.\.venv\Scripts\python.exe scripts\ocr\ocr_preprocess.py `
  --input-root "docs\Seed_Daa\Báo cáo tài chính" `
  --output-root "runtime\ocr\output"
```

The command processes 11 scanned PDFs and copies `HPG/bctc-hop-nhat-quy-i-2026.pdf` byte-for-byte. It preserves every relative path and filename.

Generated files are ignored by Git:

```text
runtime/ocr/output/   searchable seed root containing 12 PDFs
runtime/ocr/work/     temporary files
runtime/ocr/manifest.json
runtime/ocr/summary.json
```

Every OCR output is published atomically only after it opens successfully, keeps the original page count, stays within the unchanged R3 limit of 100 MB and passes the existing R3 text-layer gate. A rerun reuses a valid output when its recorded input checksum still matches. An old `skip-text` output is regenerated if it still contains an image page with fewer than R3's 40-character page threshold.

The scanned seed PDFs may contain digital signatures. Adding any text layer necessarily invalidates such a signature, so the runner explicitly permits signature invalidation **only on the generated output**. The signed source PDF remains byte-for-byte unchanged and its checksum is checked again before publication.

The runner starts with OCRmyPDF `skip-text` mode and lossless output settings. The initial `redo-ocr` pilot was rejected because the source contains a user-fillable form. If `skip-text` still fails the unchanged R3 document gate, the runner flattens annotations/widgets into a temporary copy and retries that copy once with `force-ocr`. The fallback uses OCRmyPDF optimization level 3 because uncompressed GAS outputs exceed R3's 100 MB limit.

`skip-text` can also skip a scanned page merely because the page number or a signature adds a tiny amount of existing text. The runner therefore finds every image page with fewer than 40 extracted characters, flattens the intermediate PDF and force-OCRs only those page numbers. This recovered three FPT table pages that the document-level R3 summary alone did not detect. `forcedPages` and `remainingLowTextPages` make this decision auditable. GAS Q3 page 47 remains below the threshold after full force OCR because the source page is visually blank except for verification marks.

Flattening preserves visible signature/stamp appearances that direct rasterization of an interactive PDF can omit. The source remains untouched. `ocrMode` records the selected path so fallback files receive additional visual QA.

## Manifest contract

`runtime/ocr/manifest.json` contains one entry per relative path. The stable audit fields are:

| Field | Meaning |
|---|---|
| `relativePath` | Input-relative path; never an absolute machine path |
| `action` | `ocr` or `copied` |
| `ocrMode` | OCR path used, or `null` for the control copy |
| `status` / `errorCode` | Stable result and failure code |
| `inputChecksum` / `outputChecksum` | SHA-256 integrity evidence |
| `inputBytes` / `outputBytes` | File sizes used by acceptance checks |
| `pageCountBefore` / `pageCountAfter` | Page-count invariant |
| `textLayerReady` | Result of the unchanged R3 document gate |
| `forcedPages` | Sparse image pages explicitly OCRed after `skip-text` |
| `remainingLowTextPages` | Sparse pages after OCR; each requires visual justification |
| `reused` | Whether the latest run reused the validated output |

## Verification

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s scripts\ocr -p "test_*.py"
Push-Location ai-service
$env:SEED_DATA_PATH="..\runtime\ocr\output"
..\.venv\Scripts\python.exe -m app.ingestion scan --dry-run
Pop-Location
```

Run the second command from `ai-service`. The required final summary is:

```text
discovered=12
ready=12
failed=0
```

Before handoff, compare the first, middle and last page of one FPT, GAS, scanned HPG and HSG report. OCR can make reading-order mistakes in dense financial tables, so passing the text-layer heuristic alone is not sufficient visual evidence.

## Local acceptance result (2026-08-15)

- Inventory: 12 PDFs; 11 OCR outputs and one byte-identical control copy.
- R3 dry-run: `discovered=12`, `ready=12`, `failed=0`.
- Tests: 8 OCR tests passed; AI service suite ran 12 tests, with 10 passed and 2 database integration tests skipped.
- Input integrity: all 12 source SHA-256 checksums unchanged.
- Page count: unchanged for all 12 files.
- Rerun: 12 output checksums unchanged; completed in about two seconds.
- Clean native-Windows batch: 2,050.797 seconds (about 34 minutes 11 seconds); observed peak process-tree working set 976.41 MiB with `jobs=1`.
- Input size: 90,289,680 bytes (86.11 MiB). Output size: 323,580,856 bytes (308.59 MiB).
- GAS outputs: 94,464,484; 90,012,146; and 97,080,863 bytes, all below the unchanged 100 MiB R3 limit.
- Immediate rerun: about 2.3 seconds with `processed=0`, `reused=12` and all output checksums unchanged.
- Visual QA: first/middle/last pages checked for FPT, GAS, scanned HPG and HSG; signatures, stamps, tables, page geometry and page order remained visible.

The Docker build/full run and peak-memory measurement must still be captured in Codespaces before merge. Do not present the local result as Codespaces evidence.

## Known limitations

- OCR creates searchable text for retrieval; it does not guarantee spreadsheet-quality row/column reconstruction for dense financial tables.
- Reading order may differ from visual column order. R4B citations must retain page numbers so users can verify the source page.
- Adding a text layer invalidates cryptographic signatures on generated PDFs. Signed source PDFs remain unchanged.
- `remainingLowTextPages` must be visually reviewed. A non-empty list is acceptable only for a genuinely blank or nearly blank source page.
