# WikiStock AI Service

AI Service chịu trách nhiệm tiền kiểm PDF, chia đoạn theo trang, tạo embedding, lưu dữ liệu RAG, truy xuất bằng pgvector và sinh câu trả lời có bằng chứng. Backend là lớp duy nhất dựng citation công khai và URL mở PDF.

## Hai chế độ chạy

| `AI_PROVIDER` | Hành vi |
|---|---|
| `demo` | Không gọi database hoặc provider; luôn trả `isConfident=false` và không có evidence |
| `gateway` | Truy xuất tài liệu, gọi provider thật và kiểm tra chặt JSON cùng chunk ID |

Chế độ demo chỉ dùng để kiểm tra kết nối giữa các service. Không dùng kết quả demo để nghiệm thu RAG.

## Chuẩn bị môi trường local

Yêu cầu:

- Python 3.12 64-bit.
- PostgreSQL có pgvector nếu chạy ngoài Docker.
- Bộ PDF đã qua OCR tại `runtime/ocr/output` nếu muốn ingest đủ 12 tài liệu.

Từ thư mục gốc repository:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ai-service\requirements.txt
Copy-Item ai-service\.env.example ai-service\.env
```

Khi chạy lệnh trong thư mục `ai-service`, dùng Python của virtual environment ở thư mục gốc:

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Biến môi trường chính

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SEED_DATA_PATH` | `/data/seed_data` | Thư mục gốc chứa các thư mục mã cổ phiếu và PDF |
| `DATABASE_URL` | Rỗng | PostgreSQL dùng cho ingest và retrieval |
| `EMBEDDING_MODEL` | `BAAI/bge-m3` | Model embedding dùng thống nhất khi ingest và truy vấn |
| `EMBEDDING_DIMENSIONS` | `1024` | Số chiều vector phải khớp schema pgvector |
| `CHUNK_VERSION` | `v1-page-block-1800-200` | Phiên bản thuật toán chia đoạn |
| `RETRIEVAL_TOP_K` | `5` | Số đoạn tối đa được truy xuất |
| `RETRIEVAL_MIN_SIMILARITY` | `0.35` | Ngưỡng cosine similarity tối thiểu |
| `AI_PROVIDER` | `demo` | Chọn `demo` hoặc `gateway` |
| `AI_API_BASE_URL` | Gateway Zunef | Base URL tương thích Anthropic Messages |
| `AI_API_KEY` | Rỗng | Client API key; không được commit |
| `AI_MODEL` | `claude-sonnet-4-6` | Model provider |
| `AI_CONNECT_TIMEOUT_SECONDS` | `5` | Thời gian chờ thiết lập kết nối |
| `AI_READ_TIMEOUT_SECONDS` | `45` | Thời gian chờ provider trả nội dung |
| `HF_HOME` | Theo Hugging Face | Nơi lưu cache model |

Các tên biến `CLAUDE_*` và `ANTHROPIC_*` cũ vẫn được chấp nhận để tương thích. Cấu hình mới nên dùng nhóm `AI_*` trung lập với nhà cung cấp.

## Hợp đồng gateway đã xác minh

Client API trực tiếp sử dụng:

| Thành phần | Giá trị |
|---|---|
| Base URL | `https://claude.zunef.com/v1/ai` |
| Danh sách model | `GET /models` |
| Sinh nội dung | `POST /messages` |
| Xác thực | `x-api-key` với `AI_API_KEY` |
| Kiểu request | Anthropic Messages-compatible |
| Embedding | Không dùng gateway; V1 dùng `BAAI/bge-m3` local |

Không nhầm Client API key với token dành riêng cho Claude Code. Không đưa key vào command, fixture, log hoặc Git. Nếu key từng xuất hiện trong nơi được chia sẻ, phải yêu cầu nhà cung cấp xoay khóa.

## Lệnh ingest

Pipeline cố ý chỉ có một entrypoint `scan`. Không có CLI `add` hoặc `force` riêng.

### Tiền kiểm, không ghi database

```powershell
..\.venv\Scripts\python.exe -m app.ingestion scan --dry-run
```

### Ingest hoặc tự động re-ingest

```powershell
..\.venv\Scripts\python.exe -m app.ingestion scan
```

Hành vi:

- PDF mới: `inserted`.
- Cùng checksum, model và chunk version, trạng thái `ready`: `skipped`.
- Cùng checksum nhưng đổi model/chunk version hoặc trạng thái chưa `ready`: `reingested`.
- PDF phần lớn là ảnh và thiếu text layer: `needs_ocr`, command trả mã lỗi khác 0.
- Lỗi khác: `failed`, command trả mã lỗi khác 0.

Muốn thêm tài liệu, đặt PDF vào `<SEED_DATA_PATH>/<MÃ_CỔ_PHIẾU>/` rồi chạy dry-run và scan. Tên file nên chứa quý và năm theo dạng `Q4_2025` hoặc `Quy 4 nam 2025`.

## Cache model BGE-M3

Docker Compose lưu cache trong volume `model_cache`. Tải trước model trước buổi demo:

```powershell
docker compose run --rm ai-service python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"
```

Chạy trực tiếp trên máy host:

```powershell
$env:HF_HOME = (Resolve-Path '..\runtime').Path + '\model-cache'
..\.venv\Scripts\python.exe -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"
```

Sau khi tải, có thể đặt `HF_HUB_OFFLINE=1` để chứng minh model được đọc từ cache. Nếu model chưa có trong cache, chế độ offline sẽ thất bại với `EMBEDDING_FAILED`.

## Retrieval và sinh câu trả lời

Endpoint nội bộ:

```text
POST /api/v1/internal/ai/ask
```

Request mẫu:

```json
{
  "query": "Doanh thu FPT quý 1 năm 2026 có điểm gì đáng chú ý?",
  "companyCode": "FPT",
  "filters": {
    "year": 2026,
    "documentTypes": ["financial_statement"]
  }
}
```

AI Service chỉ trả identity nội bộ:

```json
{
  "answer": "...",
  "isConfident": true,
  "evidence": [{ "chunkId": 123, "documentId": 8 }],
  "limitations": null
}
```

Model không được tạo `sourceUrl`, tiêu đề tài liệu hoặc citation ID. Backend tra cứu các trường này từ database và từ chối evidence không thuộc đúng tài liệu `ready` của doanh nghiệp.

## Kiểm thử

### Bộ test mặc định, không cần API key

```powershell
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

### Test tích hợp database

Chỉ dùng database dành riêng cho test vì test có tạo và xóa dữ liệu:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://app_user:app_password@localhost:5432/wikistock_test'
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
Remove-Item Env:TEST_DATABASE_URL
```

### Smoke test provider thật

```powershell
$env:RUN_LIVE_AI_TESTS = '1'
$env:AI_PROVIDER = 'gateway'
# Nạp AI_API_KEY bằng kênh bí mật của môi trường, không đặt trực tiếp vào script.
..\.venv\Scripts\python.exe -m unittest tests.test_live_ai -v
Remove-Item Env:RUN_LIVE_AI_TESTS
```

## Đánh giá RAG

```powershell
# Chỉ retrieval
..\.venv\Scripts\python.exe -m app.evaluation

# Provider giả lập deterministic, không dùng Internet/API credit
..\.venv\Scripts\python.exe -m app.evaluation `
  --fake-provider `
  --output reports\rag_evaluation_fake_provider

# Provider thật, có dùng API credit
..\.venv\Scripts\python.exe -m app.evaluation `
  --live-provider `
  --output reports\rag_evaluation_live
```

Kết quả fake-provider chỉ chứng minh đường kiểm tra evidence hoạt động; không đại diện cho chất lượng model thật. Kết quả live gần nhất và rủi ro còn mở được ghi tại `reports/rag_evaluation_live.md` và `../docs/R8_POST_EVALUATION_RISK.md`.

## Tài liệu liên quan

- [Runbook vận hành RAG](../docs/RAG_OPERATIONS_RUNBOOK.md)
- [Giới hạn và cách xử lý lỗi](../docs/RAG_KNOWN_LIMITATIONS.md)
- [API contract](../docs/API_CONTRACT.md)
- [Tiền xử lý OCR](../docs/OCR_PREPROCESSING.md)
