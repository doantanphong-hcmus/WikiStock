# Kiểm thử Backend end-to-end bằng dữ liệu thật

Tài liệu này hướng dẫn nghiệm thu B6 theo hai tầng. Tầng tự động là điều kiện bắt
buộc trước khi merge; tầng live chỉ chạy có chủ đích vì phụ thuộc Internet, VNStock
và API key của nhà cung cấp AI.

## 1. E2E tự động trên PostgreSQL test

Bộ kiểm thử khởi động NestJS thật, gọi HTTP bằng Supertest và đọc/ghi PostgreSQL
thật. Chỉ lời gọi từ Backend sang AI Service được giả lập để không tiêu tốn quota.

### Chuẩn bị

1. Tạo một database PostgreSQL riêng cho test và cài extension `vector`.
2. Không dùng database đang chứa dữ liệu dev hoặc demo.
3. Khai báo `TEST_DATABASE_URL`; nếu đang có `DATABASE_URL`, hai giá trị phải khác
   nhau.

Ví dụ PowerShell:

```powershell
$env:TEST_DATABASE_URL="postgresql://app_user:app_password@localhost:55432/wikistock_e2e"
npm run test:e2e:real-data
```

Lệnh trên tự thực hiện lần lượt:

1. Chạy toàn bộ Prisma migration.
2. Seed các danh mục ổn định và kiểm tra schema/pgvector.
3. Tạo fixture giống dữ liệu crawler cho 10 mã demo.
4. Khởi động NestJS trong tiến trình test và gọi public API thật.
5. Dọn đúng các record và file tạm do suite tạo.

### Phạm vi được chứng minh

- Danh sách doanh nghiệp có đủ 10 mã demo của crawler.
- Hồ sơ FPT đọc đúng sàn giao dịch và ngành từ database.
- Tài chính FPT mặc định trả kỳ mới nhất và lọc đúng kỳ yêu cầu.
- Danh sách tài liệu không lẫn doanh nghiệp và không công khai tài liệu `pending`.
- Evidence từ AI được ánh xạ sang citation chuẩn trong database.
- URL citation mở được đúng file PDF đã đăng ký.
- Backend chặn PDF `pending`, đường dẫn thoát khỏi thư mục seed và evidence của
  doanh nghiệp khác.
- Doanh nghiệp hoặc kỳ tài chính không tồn tại trả đúng mã lỗi `404`.

## 2. Smoke test live VNStock

Smoke test này ghi dữ liệu vào database dev/demo đã chọn. Kiểm tra kỹ `DATABASE_URL`
trước khi chạy.

```powershell
cd crawler
$env:DATABASE_URL="postgresql://app_user:app_password@localhost:5432/app_db"
.\.venv\Scripts\python.exe main.py --ticker FPT
```

Sau khi crawler hoàn tất, khởi động Backend rồi kiểm tra các API công khai:

```powershell
cd ..\backend
npm run start:dev
```

```text
GET http://localhost:3001/api/v1/companies/FPT/profile
GET http://localhost:3001/api/v1/companies/FPT/financials
GET http://localhost:3001/api/v1/companies/FPT/documents
GET http://localhost:3001/api/v1/companies/FPT/citations
```

Ghi lại ngày chạy, commit, số record crawler báo thành công, HTTP status của bốn API
và lỗi đầy đủ nếu có. Không coi live smoke thành công nếu chỉ kiểm tra fixture E2E.

## 3. Smoke test live AI tùy chọn

Chỉ chạy khi đã cấu hình provider và API key hợp lệ. Gửi một câu hỏi đã chuẩn bị cho
FPT, kiểm tra câu trả lời có citation, sau đó mở `sourceUrl` của citation và xác nhận
PDF tải được.

Nếu chưa có key hoặc provider gặp lỗi, ghi trạng thái `pending` cùng lý do. Trạng
thái này không chặn bộ E2E tự động, nhưng chưa được tuyên bố luồng AI live đã nghiệm
thu.

## Mẫu ghi kết quả live gần nhất

### Kết quả ngày 20/08/2026

```text
Thời gian: 20/08/2026 12:52 (UTC+7)
Commit kiểm thử: c19c167
Môi trường: PostgreSQL 18 + pgvector, database riêng wikistock_e2e
Crawler FPT: PASS - 96 record (1 company, 4 report, 90 line item, 1 news)
Profile API: PASS - HTTP 200, Công ty Cổ phần FPT
Financial API: PASS - HTTP 200, kỳ mới nhất 2026-Q2, 25 chỉ tiêu
Documents API: PASS - HTTP 200, danh sách rỗng vì lần crawl này không nạp PDF
Citations API: PASS - HTTP 200, danh sách rỗng vì chưa ingest PDF/citation
AI live + mở PDF citation: PENDING - ngoài phạm vi lần smoke crawler này
Ghi chú: vnstock 4.0.5 cảnh báo API cũ đã deprecated và có bản 4.0.6.
```

Lần chạy trong sandbox bị chặn socket (`WinError 10013`); chạy lại với quyền truy
cập mạng cho đúng cùng command đã thành công. Đây là giới hạn môi trường chạy, không
phải lỗi crawler hay Backend.

### Mẫu cho lần chạy tiếp theo

```text
Thời gian:
Commit:
Database/môi trường:
Crawler FPT: PASS / FAIL / CHƯA CHẠY
Profile API: PASS / FAIL / CHƯA CHẠY
Financial API: PASS / FAIL / CHƯA CHẠY
Documents API: PASS / FAIL / CHƯA CHẠY
Citations API: PASS / FAIL / CHƯA CHẠY
AI live + mở PDF citation: PASS / FAIL / PENDING
Ghi chú/lỗi:
```
