# Runbook vận hành RAG WikiStock

Tài liệu này giúp một thành viên mới dựng pipeline RAG từ database sạch, kiểm tra chế độ offline, gọi provider thật và xác minh citation mà không cần đoán kiến trúc hoặc biến môi trường.

## 1. Phạm vi

Runbook bao phủ:

```text
PDF đã có text layer
  → dry-run
  → chia đoạn + BGE-M3 embedding
  → PostgreSQL/pgvector
  → retrieval
  → AI provider
  → Backend xác minh evidence
  → citation mở PDF đúng trang
```

OCR là bước chuẩn bị đầu vào, không nằm trong tiến trình ingest. Nếu chưa có `runtime/ocr/output`, thực hiện `docs/OCR_PREPROCESSING.md` trước.

## 2. Điều kiện tiên quyết

- Git.
- Docker Engine và Docker Compose V2; Docker Desktop chỉ là một cách cung cấp hai thành phần này.
- Tối thiểu khoảng 8 GB RAM trống được khuyến nghị khi tải/chạy BGE-M3.
- Đủ dung lượng cho image, PostgreSQL, model cache và khoảng 309 MiB output OCR.
- 12 PDF searchable trong `runtime/ocr/output` nếu chạy bộ dữ liệu nghiệm thu đầy đủ.
- Client API key nếu chạy online; không cần key cho demo, test mặc định hoặc fake-provider evaluation.

Kiểm tra công cụ:

```powershell
git --version
docker --version
docker compose version
```

Kiểm tra đầu vào OCR từ thư mục gốc repository:

```powershell
$pdfs = Get-ChildItem runtime\ocr\output -Recurse -File -Filter *.pdf
$pdfs.Count
```

Kết quả nghiệm thu hiện tại phải là `12`. Nếu thư mục không tồn tại hoặc số lượng khác 12, không tiếp tục ingest như thể dữ liệu đã đầy đủ.

## 3. Chuẩn bị cấu hình an toàn

```powershell
Copy-Item .env.example .env
```

Mở `.env` và thay ít nhất:

- `JWT_SECRET`: chuỗi ngẫu nhiên tối thiểu 32 ký tự.
- `RAG_SEED_DATA_PATH`: giữ `./runtime/ocr/output` nếu dùng output OCR chuẩn.
- `AI_PROVIDER=demo` cho lần dựng offline đầu tiên.

Không làm các việc sau:

- Không dán key trực tiếp vào command sẽ lưu trong shell history.
- Không commit `.env`.
- Không gửi `.env` qua chat, issue hoặc PR.
- Không dùng token dành cho Claude Code thay cho Client API key.

Khi chạy online, nạp secret bằng secret store của môi trường hoặc điền `AI_API_KEY` trong `.env` local qua kênh an toàn. Client API đã xác minh dùng:

```dotenv
AI_PROVIDER=gateway
AI_API_BASE_URL=https://claude.zunef.com/v1/ai
AI_AUTH_SCHEME=bearer
AI_MODEL=claude-sonnet-4-6
```

## 4. Khởi động từ database sạch

> Cảnh báo: lệnh `docker compose down --volumes` xóa database và model cache của project Compose hiện tại. Chỉ chạy khi chủ động muốn tạo môi trường local sạch và không cần giữ dữ liệu cũ.

```powershell
docker compose down --volumes
docker compose up -d --build
docker compose ps
```

Compose thực hiện theo thứ tự:

1. Khởi động PostgreSQL có pgvector.
2. Chờ healthcheck database.
3. Chạy Prisma migration, seed dữ liệu tham chiếu và kiểm tra schema.
4. Khởi động AI Service, Backend và Frontend.

Kiểm tra health:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:8000/health
```

Nếu `db-migrate` không hoàn thành, xem log trước khi ingest:

```powershell
docker compose logs db-migrate
docker compose logs postgres
```

## 5. Tải trước và kiểm tra cache BGE-M3

Lần đầu model có thể mất nhiều phút để tải. Tải trước vào named volume `model_cache`:

```powershell
docker compose run --rm ai-service python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3'); print('model-cache-ready')"
```

Chứng minh cache hoạt động khi không truy cập Hugging Face:

```powershell
docker compose run --rm -e HF_HUB_OFFLINE=1 ai-service python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3'); print('offline-cache-ready')"
```

Không xóa volume `model_cache` ngay trước buổi demo.

## 6. Dry-run PDF

Dry-run đọc PDF, kiểm tra metadata/text layer và chia đoạn nhưng không tải model, không gọi provider và không ghi database:

```powershell
docker compose run --rm ai-service python -m app.ingestion scan --dry-run
```

Điều kiện đạt với output OCR chuẩn:

```json
{"summary":{"discovered":12,"dryRun":true,"failed":0,"ready":12}}
```

Command in một JSON object cho mỗi file và một object `summary` ở cuối. Nếu có `needs_ocr` hoặc `failed`, xử lý file lỗi trước khi ingest.

## 7. Ingest PDF

```powershell
docker compose run --rm ai-service python -m app.ingestion scan
```

Lần đầu từ database sạch phải có:

- `discovered=12`.
- Tổng `inserted=12`.
- Không có `failed` hoặc `needs_ocr`.

Summary tương ứng:

```json
{"summary":{"discovered":12,"dryRun":false,"inserted":12}}
```

Ingest tạo embedding local; nó không gọi AI provider và không tiêu thụ API credit.

## 8. Chạy lần hai để chứng minh idempotency

```powershell
docker compose run --rm ai-service python -m app.ingestion scan
```

Summary thực tế chỉ in các trạng thái có số lượng lớn hơn 0. Kết quả mong đợi:

```json
{"summary":{"discovered":12,"dryRun":false,"skipped":12}}
```

Không được xuất hiện `inserted`, `reingested`, `failed` hoặc `needs_ocr` trong lần chạy này.

Nếu lần hai tiếp tục insert/re-ingest, dừng nghiệm thu và kiểm tra checksum, `EMBEDDING_MODEL`, `CHUNK_VERSION` cùng trạng thái tài liệu.

Kiểm tra database:

```powershell
docker compose exec -T postgres psql -U app_user -d app_db -c @"
SELECT count(DISTINCT d.document_id) AS documents,
       count(DISTINCT d.document_id) FILTER (
           WHERE d.ingestion_status = 'ready'
       ) AS ready,
       count(*) FILTER (
           WHERE ch.embedding IS NULL OR vector_dims(ch.embedding) <> 1024
       ) AS invalid_embeddings
FROM source_document d
JOIN data_source s ON s.source_id = d.source_id
LEFT JOIN document_chunk ch ON ch.document_id = d.document_id
WHERE s.source_name = 'WikiStock seed PDF';
"@
```

Kỳ vọng: `documents=12`, `ready=12`, `invalid_embeddings=0`.

## 9. Chạy test offline

Các test mặc định không cần Internet hoặc AI credit:

```powershell
docker compose run --rm ai-service python -m unittest discover -s tests -v
docker compose exec backend npm test -- --runInBand
```

Chạy cổng đánh giá RAG deterministic:

```powershell
docker compose run --rm ai-service python -m app.evaluation `
  --fake-provider `
  --output reports/rag_evaluation_fake_provider
```

`fake-provider` kiểm tra retrieval, evidence validation và cách tính metric. Nó không chứng minh chất lượng model thật.

## 10. Demo offline

Giữ cấu hình:

```dotenv
AI_PROVIDER=demo
AI_DEMO_MODE=false
```

Tạo lại container sau khi sửa `.env`:

```powershell
docker compose up -d --force-recreate ai-service backend
```

Gọi Backend:

```powershell
$body = @{
  query = 'Doanh thu FPT quý 1 năm 2026 có điểm gì đáng chú ý?'
  companyCode = 'FPT'
  filters = @{
    year = 2026
    documentTypes = @('financial_statement')
  }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod `
  -Method Post `
  -Uri 'http://localhost:3001/api/v1/ai/ask' `
  -ContentType 'application/json' `
  -Body $body
```

Kết quả demo hợp lệ phải có `isConfident=false`. Chế độ này chỉ chứng minh HTTP path Backend → AI Service hoạt động; nó cố ý không chạy retrieval và không gọi provider.

## 11. Demo online với provider thật

Trong `.env` local:

```dotenv
AI_PROVIDER=gateway
AI_DEMO_MODE=false
AI_API_BASE_URL=https://claude.zunef.com/v1/ai
AI_API_KEY=
AI_MODEL=claude-sonnet-4-6
```

Điền giá trị `AI_API_KEY` trong file local bằng kênh an toàn trước khi tạo lại container.

Sau khi cập nhật:

```powershell
docker compose up -d --force-recreate ai-service backend
docker compose logs --tail 50 ai-service backend
```

Gọi lại request ở Mục 10:

```powershell
$response = Invoke-RestMethod `
  -Method Post `
  -Uri 'http://localhost:3001/api/v1/ai/ask' `
  -ContentType 'application/json' `
  -Body $body

$response.data | ConvertTo-Json -Depth 6
```

Điều kiện nghiệm thu câu trả lời tự tin:

- `answer` không rỗng.
- `isConfident=true`.
- `citations` không rỗng.
- Mỗi citation có `citationId`, `documentId`, `docTitle`, `sourceUrl`, `locationRef` và `excerpt`.
- Không có citation nào do model tự tạo; Backend phải dựng chúng từ database.

## 12. Mở citation và đối chiếu đúng trang

```powershell
$citation = $response.data.citations[0]
$pageText = [regex]::Match($citation.locationRef, '\d+').Value
if (-not $pageText) { throw 'Citation không có số trang' }

$pdfUrl = 'http://localhost:3001' + $citation.sourceUrl
Start-Process "$pdfUrl#page=$pageText"
```

Kiểm tra thủ công:

1. URL trả PDF và mở được trên trình duyệt.
2. PDF thuộc đúng doanh nghiệp.
3. Kỳ báo cáo đúng với bộ lọc.
4. Trang trong `locationRef` tồn tại.
5. `excerpt` xuất hiện hoặc được trang đó hỗ trợ trực tiếp.
6. Nội dung citation thực sự chứng minh mệnh đề trong câu trả lời.

Không chấp nhận một citation chỉ vì nó có cùng chủ đề.

## 13. Thêm PDF mới

Pipeline không có lệnh `add` riêng. Thư mục seed chính là inbox.

1. Tạo hoặc chọn thư mục mã cổ phiếu đã được hỗ trợ: `FPT`, `GAS`, `HPG`, `HSG`.
2. Đặt PDF vào `<RAG_SEED_DATA_PATH>/<MÃ_CỔ_PHIẾU>/`.
3. Giữ tên file có quý/năm, ví dụ `FPT_Baocaotaichinh_Q2_2026.pdf`.
4. Chạy dry-run.
5. Nếu `ready_for_ingestion`, chạy scan không có `--dry-run`.
6. Chạy scan lần hai và xác nhận tài liệu mới chuyển sang `skipped`.

Không sửa trực tiếp 12 PDF nguồn trong `docs/Seed_Daa`. Nếu tài liệu scan chưa có text layer, đưa nó qua OCR và chỉ ingest bản output.

## 14. Re-ingest tài liệu

Không có cờ `--force`. Re-ingest tự xảy ra với cùng checksum khi một trong các điều kiện thay đổi:

- `EMBEDDING_MODEL`.
- `CHUNK_VERSION`.
- Trạng thái tài liệu không còn là `ready`.

Quy trình an toàn khi chủ động đổi thuật toán chunking:

```powershell
# Sửa CHUNK_VERSION trong .env, ví dụ v2-page-block-1800-200.
docker compose up -d --force-recreate ai-service
docker compose run --rm ai-service python -m app.ingestion scan --dry-run
docker compose run --rm ai-service python -m app.ingestion scan
```

Không tăng `CHUNK_VERSION` chỉ để ép chạy lại khi thuật toán không đổi. Thay nội dung file làm checksum đổi và hiện được xem là tài liệu mới; xem giới hạn trong `RAG_KNOWN_LIMITATIONS.md`.

## 15. Dừng hệ thống

Giữ dữ liệu và cache:

```powershell
docker compose down
```

Xóa toàn bộ database/cache local để dựng lại từ đầu:

```powershell
docker compose down --volumes
```

Lệnh thứ hai không thể hoàn tác nếu chưa backup volume.

## 16. Checklist nghiệm thu

- [ ] Có đúng 12 PDF searchable trong output OCR.
- [ ] `.env` không nằm trong Git.
- [ ] Compose build và tất cả service cần thiết healthy/running.
- [ ] Dry-run báo 12 ready, 0 failed.
- [ ] Ingest đầu tiên tạo đủ 12 tài liệu ready.
- [ ] Ingest lần hai skip đủ 12 tài liệu.
- [ ] Test AI Service và Backend đạt.
- [ ] Fake-provider evaluation tạo report.
- [ ] Demo offline trả kết quả không tự tin và không dùng provider.
- [ ] Demo online đi qua Backend và provider thật.
- [ ] Citation URL mở được PDF.
- [ ] Trang và excerpt trực tiếp hỗ trợ câu trả lời.
- [ ] Câu ngoài dữ liệu trả `isConfident=false`.
- [ ] Không có secret, cache hoặc output runtime trong diff.

## 17. Khi có lỗi

Tra cứu mã lỗi và hành động xử lý tại [Giới hạn đã biết và cách xử lý lỗi RAG](RAG_KNOWN_LIMITATIONS.md). Không bật `AI_DEMO_MODE=true` để che lỗi trong một lần nghiệm thu online.
