# Vận hành Backend tối thiểu

Tài liệu này mô tả các chốt vận hành được áp dụng từ B7. Mục tiêu là giúp Backend
dừng sớm khi cấu hình sai, báo đúng thành phần gặp lỗi và không đưa thông tin nhạy
cảm ra HTTP response hoặc access log.

## Cấu hình bắt buộc

Backend kiểm tra cấu hình trước khi tạo NestJS application. Khi có lỗi, tiến trình
dừng với danh sách tên biến không hợp lệ nhưng không in giá trị secret.

| Biến                                                      | Yêu cầu                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`                                            | URL `postgresql://` hoặc `postgres://` hợp lệ                                   |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Dùng đủ bộ này khi không có `DATABASE_URL`                                      |
| `JWT_SECRET`                                              | Ít nhất 32 ký tự, không dùng giá trị mẫu; chỉ được bỏ qua trong `NODE_ENV=test` |
| `AI_SERVICE_URL`                                          | URL HTTP(S) hợp lệ                                                              |
| `AI_SERVICE_TIMEOUT_MS`                                   | Số nguyên dương                                                                 |
| `FRONTEND_URL`                                            | HTTP(S) origin, không chứa path hoặc query                                      |
| `SEED_DATA_PATH`                                          | Đường dẫn không rỗng                                                            |

`PORT` và `JWT_EXPIRES_IN_SECONDS` là tùy chọn nhưng phải là số nguyên dương nếu
được khai báo.

## Health check

`GET /api/health` kiểm tra cả tiến trình Backend và kết nối PostgreSQL bằng
`SELECT 1`.

- PostgreSQL hoạt động: HTTP `200`, trạng thái `ready`.
- PostgreSQL lỗi: HTTP `503`, mã lỗi `DATABASE_UNAVAILABLE`.
- AI Service không nằm trong readiness gate vì Company và Financial API không phụ
  thuộc AI. Lỗi AI chỉ ảnh hưởng endpoint hỏi đáp và được trả bằng `502` hoặc `504`.

## Cấu trúc lỗi công khai

Mọi lỗi HTTP dùng cùng envelope:

```json
{
  "statusCode": 400,
  "message": "Request validation failed",
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "details": "query must not be empty"
  }
}
```

Các nhóm lỗi chuẩn gồm `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`PAYLOAD_TOO_LARGE`, lỗi nghiệp vụ hiện có, lỗi AI `502/504` và
`INTERNAL_SERVER_ERROR`.

Lỗi nội bộ `500` không trả exception message, stack trace, URL database hoặc secret.

## Access log và dữ liệu nhạy cảm

Mỗi request runtime ghi bốn thông tin:

```text
METHOD PATH STATUS DURATION_MS
```

Exception log bổ sung error code. Hệ thống không log request body, password, JWT,
API key, prompt hoặc nội dung tài liệu. Log dùng `request.path`, không dùng URL kèm
query string.

## CORS và giới hạn request

- CORS chỉ phát hành header cho origin được cấu hình bằng `FRONTEND_URL`.
- JSON và form body bị giới hạn ở `32kb`.
- Câu hỏi AI tối đa 4.000 ký tự.
- Context tối đa 8.000 ký tự.
- Mã cổ phiếu chỉ nhận 1–10 ký tự chữ hoặc số.
- Request vượt giới hạn trả HTTP `413` với mã `PAYLOAD_TOO_LARGE`.

## Redis

Không có consumer Redis trong Backend hoặc AI Service V1. Vì vậy B7 đã bỏ Redis,
`REDIS_HOST`, `REDIS_PORT` và các quan hệ `depends_on` tương ứng khỏi Docker Compose.
Chỉ thêm Redis trở lại khi có cache, queue hoặc rate-limit thực sự sử dụng nó.

## Dependency audit ngày 20/08/2026

Đã chạy read-only, không dùng `npm audit fix` hoặc `--force`:

```powershell
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

Audit ghi nhận advisory gián tiếp trong toolchain Prisma, Nest CLI, Jest và ESLint.
Đặc biệt, cách sửa `deepmerge-ts` do npm đề xuất sẽ hạ Prisma từ 7 xuống 6 và là
breaking change. B7 không tự động thay lockfile hoặc hạ phiên bản framework.

- Audit có `--omit=dev`: 4 advisory mức cao.
- Audit đầy đủ: 6 advisory mức cao.
- Không phát hiện dependency Redis nào đang được application code sử dụng.

Team cần đánh giá lại sau khi Prisma/Nest/Jest phát hành dependency tree đã vá. Nếu
một advisory được xác nhận nằm trên runtime path nhận input từ người dùng, ưu tiên
nâng dependency trực tiếp bằng PR riêng và chạy lại migration, unit test, E2E và
build.
