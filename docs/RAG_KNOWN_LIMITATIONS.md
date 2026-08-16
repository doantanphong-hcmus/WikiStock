# Giới hạn đã biết và xử lý lỗi RAG

Tài liệu này ghi các giới hạn đã xác nhận của pipeline hiện tại và hành động vận hành tương ứng. Không dùng workaround để biến một lần nghiệm thu lỗi thành kết quả thành công giả.

## 1. Mức độ sẵn sàng hiện tại

- Pipeline OCR → ingest → retrieval → generation → Backend citation đã chạy được end-to-end.
- Retrieval offline đạt ngưỡng R8 trên bộ 20 câu.
- Live-provider evaluation gần nhất **không đạt** cổng chất lượng production.
- R8 hoàn thành về khả năng đánh giá; AI chưa được tuyên bố đạt độ tin cậy 99%.
- Mọi câu trả lời tài chính thiếu bằng chứng phải fail closed.

Chi tiết số liệu: [Rủi ro độ tin cậy sau R8](R8_POST_EVALUATION_RISK.md).

## 2. Giới hạn dữ liệu và OCR

### Chỉ hỗ trợ bốn mã cổ phiếu trong ingestion V1

Metadata parser hiện chỉ chấp nhận:

- `FPT`
- `GAS`
- `HPG`
- `HSG`

Thư mục mã khác trả `UNKNOWN_COMPANY_CODE`, kể cả khi database đã có doanh nghiệp đó. Khi mở rộng dữ liệu, phải cập nhật contract/parser và test; không đổi tên doanh nghiệp thành một mã đã biết để lách kiểm tra.

### Output OCR không nằm trong Git

`runtime/ocr/output` bị ignore để tránh commit hàng trăm MiB PDF sinh ra. Một clean checkout chỉ có PDF nguồn; Dev phải chạy bước OCR trước khi ingest đủ 12 tài liệu.

### OCR không tái tạo bảng như spreadsheet

OCR tạo text layer phục vụ tìm kiếm nhưng có thể:

- Đọc sai thứ tự cột.
- Tách số khỏi đơn vị.
- Ghép dòng không đúng cấu trúc bảng.
- Nhận sai dấu phân cách hoặc ký tự tiếng Việt.

Vì vậy citation phải giữ số trang và người nghiệm thu phải mở PDF đối chiếu trực quan.

### Chữ ký số trên output OCR

Thêm text layer làm chữ ký mật mã trên bản output không còn nguyên trạng. PDF nguồn được giữ nguyên checksum; chỉ ingest bản output đã qua OCR.

## 3. Giới hạn nhận diện metadata

- PDF phải nằm dưới `<SEED_DATA_PATH>/<MÃ_CỔ_PHIẾU>/`.
- Tên file nên chứa quý và năm theo dạng `Q1_2026`, `Quy 1 2026` hoặc `Quy I nam 2026`.
- Không đọc metadata kỳ báo cáo từ nội dung PDF.
- Không nhận diện báo cáo năm, bán niên hoặc kỳ đặc biệt ngoài các pattern hiện có.
- Không phân biệt báo cáo hợp nhất và riêng lẻ bằng metadata có cấu trúc.
- Nếu không đọc được kỳ, ingest vẫn có thể tiếp tục với cảnh báo `UNPARSED_REPORT_PERIOD`; truy vấn theo năm sẽ không tìm thấy tài liệu đó.

## 4. Giới hạn ingest và vòng đời tài liệu

### Không có CLI `add`, `delete` hoặc `force`

Command duy nhất là:

```text
python -m app.ingestion scan [--dry-run]
```

Thêm tài liệu bằng cách đặt file vào seed root. Re-ingest tự xảy ra khi cùng checksum nhưng model/chunk version/trạng thái thay đổi.

### File thay nội dung được xem là tài liệu mới

Identity persistence hiện dựa trên checksum. Nếu thay nội dung một file nhưng giữ nguyên đường dẫn, checksum mới có thể tạo thêm `source_document`; pipeline chưa tự archive bản cũ theo `fileRef`.

Không thay PDF đã ingest trong im lặng. Giữ bản nguồn có phiên bản rõ ràng và mở task quản lý revision trước khi dùng cho dữ liệu cập nhật thường xuyên.

### Không có cơ chế xóa tài liệu qua ingestion CLI

Xóa PDF khỏi seed root không xóa record, chunk hoặc citation trong database. Thao tác archive/xóa cần quy trình quản trị riêng; không chạy SQL xóa thủ công trong buổi demo.

### Re-ingest thay toàn bộ chunk/citation

Với một document được re-ingest, pipeline xóa chunk/citation cũ rồi ghi lại trong transaction. ID citation/chunk có thể đổi; client không được lưu chúng như định danh vĩnh viễn giữa các phiên bản ingest.

## 5. Giới hạn embedding và retrieval

- V1 dùng duy nhất `BAAI/bge-m3`, vector 1.024 chiều.
- Ingest và query phải dùng cùng model và dimension.
- Model lần đầu cần tải từ Internet nếu cache chưa có.
- Retrieval hiện là exact cosine search trên khoảng 930 chunk.
- Chưa có HNSW, hybrid keyword search hoặc reranker vì quy mô hiện tại chưa cần.
- `top_k=5` và threshold `0.35` là baseline, không phải giá trị đúng cho mọi loại tài liệu.
- Retrieval có thể tìm đoạn cùng chủ đề nhưng sai dòng/bảng cụ thể.
- Golden set hiện có 20 câu, chưa đủ chứng minh 99%.

Chỉ thêm index/reranker/hybrid khi benchmark cho thấy exact retrieval không đạt, tránh tăng độ phức tạp theo suy đoán.

## 6. Giới hạn provider và sinh câu trả lời

### Output JSON chưa tuyệt đối ổn định

Gateway tương thích Anthropic Messages nhưng chưa có hợp đồng JSON mode được xác minh. Model đã từng:

- Trả lời diễn giải trước JSON.
- Trả nội dung không có JSON hợp lệ.

Parser chỉ chấp nhận JSON vượt qua schema validation. Nó không tự suy đoán trường từ văn bản tự do.

### Timeout chưa dùng `API_TIMEOUT_MS`

Provider từng cung cấp biến `API_TIMEOUT_MS`, nhưng WikiStock hiện dùng:

- `AI_CONNECT_TIMEOUT_SECONDS`
- `AI_READ_TIMEOUT_SECONDS`

Hai hệ timeout có đơn vị khác nhau và chưa được ánh xạ tự động. Operator phải cấu hình biến WikiStock theo giây; không giả định `API_TIMEOUT_MS` sẽ có hiệu lực.

### Citation precision live chưa đạt

Model có xu hướng chọn nhiều đoạn liên quan thay vì chỉ chọn đoạn trực tiếp chứng minh câu trả lời. Backend xác minh citation tồn tại và thuộc đúng document/company, nhưng không thể tự động chứng minh mọi mệnh đề ngôn ngữ đều được excerpt hỗ trợ.

### Chưa có hội thoại nhiều lượt

Request nhận `conversationId` để giữ contract, nhưng pipeline hiện chưa lưu hoặc truy xuất lịch sử hội thoại. Mỗi câu hỏi được xử lý độc lập.

### Không có fallback ngầm trong production path

- `AI_PROVIDER=demo` là chế độ demo chủ động.
- `AI_DEMO_MODE=true` cho phép Backend fallback mock khi AI Service lỗi.
- Nghiệm thu online và production phải dùng `AI_DEMO_MODE=false`.

Nếu provider lỗi, hệ thống phải trả lỗi; không biến mock thành câu trả lời thành công như thể đã qua RAG.

## 7. Giới hạn citation và PDF

- AI Service chỉ trả `chunkId` và `documentId`.
- Backend chỉ tạo citation khi chunk, document, company và trạng thái `ready` khớp database.
- `sourceUrl` của file local là URL tương đối thuộc Backend.
- PDF viewer dùng fragment `#page=N`; fragment không được gửi tới server và hành vi chuyển trang phụ thuộc trình duyệt.
- `excerpt` là nội dung chunk/citation, có thể dài và giữ lỗi đọc thứ tự của OCR.
- Citation đúng identity chưa tự động đồng nghĩa nội dung trả lời đúng nghiệp vụ tài chính.

## 8. Bảng mã lỗi ingestion

| Mã lỗi | Ý nghĩa thường gặp | Hành động |
|---|---|---|
| `SEED_PATH_NOT_FOUND` | Seed root không tồn tại hoặc mount sai | Kiểm tra `RAG_SEED_DATA_PATH`, `SEED_DATA_PATH` và volume mount |
| `PATH_OUTSIDE_SEED_ROOT` | Symlink/path thoát khỏi seed root | Bỏ symlink, dùng file thật nằm trong seed root |
| `PDF_TOO_LARGE` | File vượt `MAX_PDF_SIZE_MB` | Kiểm tra nguồn; tối ưu bản output nhưng không làm giảm chất lượng tùy tiện |
| `UNKNOWN_COMPANY_CODE` | Thư mục mã chưa được parser hỗ trợ | Dùng đúng FPT/GAS/HPG/HSG hoặc mở rộng parser có test |
| `UNPARSED_REPORT_PERIOD` | Không đọc được quý/năm từ filename | Đổi filename theo convention rồi dry-run lại |
| `PDF_PARSE_FAILED` | PDF hỏng, rỗng hoặc không đọc được | Mở file thủ công, kiểm tra checksum và tạo lại output |
| `PDF_NEEDS_OCR` | Phần lớn trang là ảnh, quá ít text | Chạy `scripts/ocr/ocr_preprocess.py`, ingest output thay vì source |
| `DATABASE_URL_REQUIRED` | Chạy ingest thật nhưng thiếu DB URL | Điền `DATABASE_URL`; dry-run không cần database |
| `REFERENCE_DATA_MISSING` | Thiếu company/source/document type | Chạy `backend npm run db:bootstrap` hoặc Compose migration |
| `EMBEDDING_FAILED` | Model/cache/network/runtime lỗi | Kiểm tra model cache, Internet lần đầu, RAM và `HF_HOME` |
| `EMBEDDING_COUNT_MISMATCH` | Số vector không bằng số chunk | Dừng ingest; kiểm tra model adapter, không bỏ qua validation |
| `EMBEDDING_DIMENSION_MISMATCH` | Vector không phải 1.024 chiều | Đồng bộ model, env và schema; không pad/cắt vector |
| `INVALID_EMBEDDING` | Vector zero, NaN hoặc infinity | Dừng ingest và kiểm tra model/input |
| `INGESTION_FAILED` | Lỗi ngoài dự kiến đã được làm sạch message | Xem log AI Service, tái hiện bằng đúng một PDF và không ghi secret |
| `INVALID_CONFIG` | Env sai kiểu hoặc ngoài phạm vi | Đối chiếu `.env.example`, đặc biệt số nguyên/float/timeout |

## 9. Bảng mã lỗi retrieval và AI Service

| Mã lỗi | HTTP thường gặp | Hành động |
|---|---:|---|
| `INVALID_QUERY` | 400 | Gửi câu hỏi không rỗng và trong giới hạn contract |
| `INVALID_COMPANY_CODE` | 400 | Dùng mã cổ phiếu hợp lệ |
| `INVALID_YEAR` | 400 | Dùng năm hợp lệ theo contract |
| `INVALID_DOCUMENT_TYPE` | 400 | Dùng danh sách chuỗi không rỗng |
| `UNKNOWN_COMPANY_CODE` | 404 | Kiểm tra company đã seed/ingest |
| `UNKNOWN_DOCUMENT_TYPE` | 400 | Kiểm tra `financial_statement` hoặc loại đã seed |
| `DATABASE_URL_REQUIRED` | 400/khởi động lỗi | Cấu hình database cho chế độ gateway |
| `DATABASE_UNAVAILABLE` | 503 | Kiểm tra PostgreSQL, migration, mạng Compose và pool kết nối |
| `AI_API_KEY_REQUIRED` | 502 | Nạp Client API key khi `AI_PROVIDER=gateway` |
| `AI_AUTHENTICATION_FAILED` | 502 | Kiểm tra đúng Client API key, base URL và kiểu `x-api-key` |
| `AI_CONNECT_TIMEOUT` | 504 | Kiểm tra DNS/mạng/gateway và connect timeout |
| `AI_READ_TIMEOUT` | 504 | Kiểm tra gateway và `AI_READ_TIMEOUT_SECONDS`; không tăng vô hạn |
| `AI_RATE_LIMITED` | 502 | Chờ quota hồi phục; không retry vô hạn |
| `AI_PROVIDER_UNAVAILABLE` | 502 | Kiểm tra trạng thái provider và log đã redact |
| `AI_PROVIDER_ERROR` | 502 | Ghi lại HTTP status, không ghi response chứa dữ liệu nhạy cảm |
| `AI_INVALID_RESPONSE` | 502 | Provider trả sai JSON/schema; fail closed và lưu metric |
| `AI_INVALID_EVIDENCE` | 502 | Model chọn chunk ngoài context hoặc evidence không hợp lệ; không chuyển answer ra client |

## 10. Bảng mã lỗi Backend công khai

| Mã lỗi | HTTP | Ý nghĩa và xử lý |
|---|---:|---|
| `AI_SERVICE_UNAVAILABLE` | 502 | Backend không kết nối được hoặc AI Service trả HTTP lỗi; xem log cả hai service |
| `AI_SERVICE_TIMEOUT` | 504 | AI Service không phản hồi trong `AI_SERVICE_TIMEOUT_MS` |
| `AI_INVALID_RESPONSE` | 502 | Envelope, answer hoặc confidence sai contract |
| `AI_INVALID_EVIDENCE` | 502 | Evidence không tồn tại, sai document/company hoặc thiếu citation canonical |

Backend hiện chuẩn hóa nhiều lỗi nội bộ AI Service thành `AI_SERVICE_UNAVAILABLE`. Muốn điều tra nguyên nhân gốc, xem mã lỗi trong log/response trực tiếp của AI Service nhưng không trả stack trace hoặc secret cho người dùng.

## 11. Tình huống xử lý nhanh

### `needs_ocr`

1. Không hạ `MIN_PAGE_TEXT_CHARS` để làm xanh giả.
2. Chạy OCR theo `OCR_PREPROCESSING.md`.
3. Dry-run output.
4. Mở một số trang kiểm tra trực quan.
5. Ingest output searchable.

### Provider down hoặc timeout

1. Xác nhận `AI_DEMO_MODE=false` nếu đang nghiệm thu online.
2. Gọi `/health` của AI Service.
3. Kiểm tra base URL và credential mà không in key.
4. Phân biệt connect timeout với read timeout.
5. Ghi metric và trả lỗi an toàn; không fallback mock.

### Model cache thiếu

1. Bỏ `HF_HUB_OFFLINE=1` trong lần tải đầu.
2. Kiểm tra `HF_HOME` hoặc volume `model_cache`.
3. Tải trước BGE-M3 theo runbook.
4. Chạy lại với `HF_HUB_OFFLINE=1` để xác nhận cache.

### Citation mở sai hoặc không mở được

1. Kiểm tra `sourceUrl` là URL Backend, không phải đường dẫn file host.
2. Kiểm tra document có `fileRef`, trạng thái `ready` và nằm trong seed root.
3. Kiểm tra Backend và AI Service cùng mount một seed root.
4. Kiểm tra `locationRef` và thêm `#page=N` ở trình duyệt.
5. Nếu excerpt không hỗ trợ claim, coi là lỗi chất lượng dù HTTP trả 200.

### Scan lần hai không skip toàn bộ

1. So sánh checksum input.
2. Kiểm tra `EMBEDDING_MODEL` và `CHUNK_VERSION` có đổi không.
3. Kiểm tra document có trạng thái `ready` không.
4. Không xóa database để che lỗi idempotency.

## 12. Điều kiện nâng cấp kiến trúc

Chỉ mở rộng khi có bằng chứng đo lường:

- Thêm HNSW khi exact-search p95 vượt ngưỡng ở quy mô dữ liệu thật.
- Thêm hybrid/reranker khi golden recall không đạt sau khi sửa metadata/OCR/chunking.
- Thêm queue/background ingestion khi thời gian ingest ảnh hưởng vận hành.
- Thêm object storage khi PDF không còn phù hợp với read-only filesystem mount.
- Thêm conversation memory khi sản phẩm có contract và kiểm thử nhiều lượt rõ ràng.

Không thêm các thành phần này chỉ để “chuẩn bị cho tương lai”.
