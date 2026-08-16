# WikiStock API Contract (V1)

Tài liệu này quy định API contract giữa các service trong hệ thống WikiStock, chủ yếu là **Frontend ↔ Backend** và **Backend ↔ AI Service**.

Nguyên tắc hiện tại:

- JSON response dùng `camelCase`.
- Response shape đi gần schema Prisma và migration hiện tại.
- `ticker` là mã cổ phiếu hiển thị cho người dùng.
- Các object danh mục như `exchange`, `industry`, `metric`, `source`, `documentType` được trả về dưới dạng object lồng nhau.
- API vẫn có thể dùng route param tên `companyCode` trong V1 để giữ endpoint cũ, nhưng dữ liệu trả ra ưu tiên `ticker`, `companyId`, `companyName`.

---

## 1. Tiêu Chuẩn Chung

### 1.1. Success Response

```json
{
  "statusCode": 200,
  "message": "Fetched company profile",
  "data": {},
  "error": null
}
```

### 1.2. Error Response

```json
{
  "statusCode": 404,
  "message": "Company not found",
  "data": null,
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "details": "Company FPT is not available"
  }
}
```

Quy định:

- Frontend kiểm tra `statusCode` và `error`.
- Không trả stack trace hoặc secret cho client.
- Error code phải ổn định để frontend có thể xử lý.

---

## 2. Backend ↔ AI Service

### 2.1. Yêu Cầu AI Phân Tích

**Endpoint:** `POST /api/v1/internal/ai/ask`

**Request Payload:**

```json
{
  "query": "Doanh thu FPT năm 2025 có điểm gì đáng chú ý?",
  "companyCode": "FPT",
  "filters": {
    "year": 2025,
    "documentTypes": ["financial_statement", "annual_report"]
  },
  "conversationId": null
}
```

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "AI Generated Answer Successfully",
  "data": {
    "answer": "FPT duy trì tăng trưởng doanh thu nhờ mảng dịch vụ công nghệ.",
    "isConfident": true,
    "limitations": null,
    "evidence": [
      {
        "chunkId": 123,
        "documentId": 1
      }
    ]
  },
  "error": null
}
```

`evidence` là identity của kết quả retrieval nội bộ. AI Service chỉ được trả
`chunkId` và `documentId`; không tự tạo `citationId`, `docTitle`, `sourceUrl`,
`locationRef` hoặc `excerpt`. Backend gom các `chunkId`, truy vấn database một
lần, xác thực quan hệ chunk-document và dựng public citation từ dữ liệu gốc.

Khi thiếu dữ liệu, AI phải trả lời không đủ dữ liệu, đặt `isConfident` là
`false` và để `evidence` là mảng rỗng. Một câu trả lời có `isConfident=true`
bắt buộc phải có ít nhất một evidence hợp lệ.

Nếu evidence sai cấu trúc hoặc không trỏ tới nguồn đã biết, Backend trả HTTP
`502` với error code `AI_INVALID_EVIDENCE`; không chuyển tiếp answer thiếu
nguồn và không thay bằng citation giả.

JSON hoặc các trường `answer`/`isConfident` sai contract trả `502` với error
code `AI_INVALID_RESPONSE`; Backend không tự điền câu trả lời hoặc confidence.

Lỗi kết nối hoặc HTTP lỗi từ AI Service trả `502` với error code
`AI_SERVICE_UNAVAILABLE`. Timeout trả `504` với error code
`AI_SERVICE_TIMEOUT`.

Fallback mock chỉ được phép khi Backend chạy với `AI_DEMO_MODE=true`. Mặc định
`AI_DEMO_MODE=false`; production không chuyển lỗi AI thành response thành công.

---

## 3. Frontend ↔ Backend

### 3.1. Danh Sách Doanh Nghiệp

**Endpoint:** `GET /api/v1/companies`

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "Fetched companies",
  "data": [
    {
      "companyId": 1,
      "ticker": "FPT",
      "companyName": "Công ty Cổ phần FPT",
      "exchange": {
        "exchangeId": 1,
        "exchangeCode": "HOSE",
        "exchangeName": "Sở Giao dịch Chứng khoán TP. Hồ Chí Minh"
      },
      "industry": {
        "industryId": 1,
        "industryCode": "TECH",
        "industryName": "Công nghệ thông tin"
      },
      "listingDate": "2006-12-13",
      "charterCapital": "14700000000000.00",
      "website": "https://fpt.com",
      "description": "Tập đoàn công nghệ hàng đầu Việt Nam...",
      "executives": [],
      "citations": []
    }
  ],
  "error": null
}
```

### 3.2. Hồ Sơ Doanh Nghiệp

**Endpoint:** `GET /api/v1/companies/:companyCode/profile`

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "Fetched company profile",
  "data": {
    "companyId": 1,
    "ticker": "FPT",
    "companyName": "Công ty Cổ phần FPT",
    "exchange": {
      "exchangeId": 1,
      "exchangeCode": "HOSE",
      "exchangeName": "Sở Giao dịch Chứng khoán TP. Hồ Chí Minh"
    },
    "industry": {
      "industryId": 1,
      "industryCode": "TECH",
      "industryName": "Công nghệ thông tin"
    },
    "listingDate": "2006-12-13",
    "charterCapital": "14700000000000.00",
    "website": "https://fpt.com",
    "description": "Tập đoàn công nghệ hàng đầu Việt Nam...",
    "executives": [
      {
        "executiveId": 1,
        "fullName": "Nguyễn Văn Khoa",
        "position": "Tổng Giám đốc",
        "startDate": null,
        "endDate": null
      }
    ],
    "citations": []
  },
  "error": null
}
```

### 3.3. Dữ Liệu Tài Chính

**Endpoint:** `GET /api/v1/companies/:companyCode/financials`

Query parameters:

| Tham số | Bắt buộc | Quy tắc |
|---|---|---|
| `year` | Không | Năm tài chính dạng số nguyên |
| `quarter` | Không | Quý từ `1` đến `4`; chỉ hợp lệ khi có `year` |

Hành vi đã chốt cho V1:

- Không truyền `year` và `quarter`: trả báo cáo mới nhất của doanh nghiệp.
- Chỉ truyền `year`: trả báo cáo mới nhất trong năm đó.
- Truyền đủ `year` và `quarter`: trả đúng báo cáo quý được yêu cầu.
- Truyền `quarter` thiếu `year` hoặc giá trị không hợp lệ: trả HTTP `400` với mã lỗi `INVALID_FINANCIAL_PERIOD`.
- Doanh nghiệp hoặc kỳ báo cáo không có dữ liệu: trả HTTP `404` theo error contract chung.

B0 chốt quy ước này để Frontend và Backend dùng chung. Việc truy vấn PostgreSQL và áp dụng bộ lọc được triển khai ở B4; service dữ liệu giả hiện tại chưa được coi là implementation hoàn chỉnh.

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "Fetched financial data",
  "data": {
    "reportId": 1,
    "companyId": 1,
    "ticker": "FPT",
    "periodType": "Q",
    "fiscalYear": 2025,
    "fiscalQuarter": 4,
    "reportDate": "2026-01-26",
    "lineItems": [
      {
        "lineItemId": 1,
        "metric": {
          "metricId": 1,
          "metricCode": "REVENUE",
          "metricName": "Doanh thu",
          "unit": "VND",
          "statementType": "income_statement"
        },
        "value": "50000000000.0000"
      }
    ]
  },
  "error": null
}
```

### 3.4. Tài Liệu Nguồn

**Endpoint:** `GET /api/v1/companies/:companyCode/documents`

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "Fetched documents",
  "data": [
    {
      "documentId": 1,
      "companyId": 1,
      "source": {
        "sourceId": 1,
        "sourceName": "WikiStock Demo Source",
        "sourceType": "internal",
        "reliabilityTier": 3,
        "costTier": "free",
        "accessUrl": "https://wikistock.vn"
      },
      "documentType": {
        "docTypeId": 1,
        "typeName": "financial_statement"
      },
      "title": "Báo cáo tài chính kiểm toán hợp nhất 2025",
      "publishedDate": "2026-01-26",
      "url": "https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf",
      "fileRef": null,
      "crawledAt": "2026-07-09T00:00:00.000Z",
      "checksum": null
    }
  ],
  "error": null
}
```

`url` có thể là `null` đối với tài liệu local; khi đó `fileRef` là tham chiếu
nguồn nội bộ và Backend sẽ chịu trách nhiệm tạo URL tải file công khai.

### 3.5. Đọc File Tài Liệu Đã Đăng Ký

**Endpoint:** `GET /api/v1/documents/:documentId/file`

Endpoint chỉ phục vụ tài liệu có trạng thái `ready`, có `fileRef`, là file PDF
đã đăng ký và nằm bên trong `SEED_DATA_PATH`. Path traversal, symlink trỏ ra
ngoài seed root, tài liệu chưa sẵn sàng hoặc file không tồn tại đều trả `404`.

Response sử dụng:

```http
Content-Type: application/pdf
Content-Disposition: inline
```

### 3.6. Citation Theo Doanh Nghiệp

**Endpoint:** `GET /api/v1/companies/:companyCode/citations`

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "Fetched citations",
  "data": [
    {
      "citationId": 1,
      "documentId": 1,
      "docTitle": "Báo cáo tài chính kiểm toán hợp nhất 2025",
      "sourceUrl": "https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf",
      "locationRef": "Trang 24",
      "excerpt": "Doanh thu và lợi nhuận sau thuế tiếp tục tăng nhờ mảng dịch vụ công nghệ."
    }
  ],
  "error": null
}
```

### 3.7. Admin Data Status

**Endpoint:** `GET /api/v1/admin/companies`

**Response Payload:**

```json
{
  "statusCode": 200,
  "message": "Fetched admin company status",
  "data": [
    {
      "companyId": 1,
      "ticker": "FPT",
      "companyName": "Công ty Cổ phần FPT",
      "dataStatus": "ready",
      "sourceStatus": "available",
      "lastUpdated": "2026-07-09T00:00:00.000Z"
    }
  ],
  "error": null
}
```

---

## 4. Xác Thực

### 4.1. Đăng nhập

**Endpoint:** `POST /api/v1/auth/login`

```json
{
  "email": "admin@wikistock.vn",
  "password": "your-password"
}
```

Response trả về JWT có thời hạn mặc định 3.600 giây:

```json
{
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "accessToken": "<jwt>",
    "expiresIn": 3600,
    "user": {
      "userId": 1,
      "email": "admin@wikistock.vn",
      "fullName": "Admin",
      "role": {
        "roleId": 1,
        "roleName": "admin"
      }
    }
  },
  "error": null
}
```

### 4.2. Quyền Admin

Mọi endpoint `/api/v1/admin/*` yêu cầu header:

```http
Authorization: Bearer <jwt>
```

Backend xác minh chữ ký JWT, sau đó đọc lại role hiện tại của user từ database.
Role trong token không được dùng làm nguồn phân quyền cuối cùng, vì role có thể đã
được Admin khác thay đổi sau khi token được cấp.

- Thiếu, sai hoặc hết hạn token: `401 Unauthorized`.
- User không còn tồn tại: `401 Unauthorized`.
- User tồn tại nhưng role không phải `admin`: `403 Forbidden`.

### 4.3. Admin API

| Method  | Endpoint                                     | Chức năng                                            |
| ------- | -------------------------------------------- | ---------------------------------------------------- |
| `GET`   | `/api/v1/admin/companies`                    | Theo dõi trạng thái dữ liệu từng công ty             |
| `GET`   | `/api/v1/admin/documents`                    | Liệt kê tài liệu nguồn và trạng thái review          |
| `GET`   | `/api/v1/admin/document-options`             | Lấy company, source và document type để tạo tài liệu |
| `POST`  | `/api/v1/admin/documents`                    | Tạo tài liệu nguồn                                   |
| `PATCH` | `/api/v1/admin/documents/:documentId/review` | Duyệt hoặc từ chối tài liệu                          |
| `POST`  | `/api/v1/admin/citations/check`              | Kiểm tra metadata citation và tài liệu nguồn         |
| `GET`   | `/api/v1/admin/users`                        | Liệt kê user, không trả password hash                |
| `POST`  | `/api/v1/admin/users`                        | Tạo user                                             |
| `GET`   | `/api/v1/admin/roles`                        | Liệt kê role                                         |
| `PATCH` | `/api/v1/admin/users/:userId/role`           | Thay đổi role của user                               |

Admin không được tự hạ role của chính mình để tránh tự khoá quyền truy cập.

---

## 5. AI Web-Facing

Endpoint công khai hiện tại:

```text
POST /api/v1/ai/ask
```

Request:

```json
{
  "query": "Tình hình doanh thu FPT có điểm gì đáng chú ý?",
  "companyCode": "FPT",
  "filters": {
    "year": 2025,
    "documentTypes": ["financial_statement", "annual_report"]
  }
}
```

Response dùng public citation contract sau khi Backend đã xác thực và chuẩn hóa
`evidence` từ mục **2.1**:

```json
{
  "statusCode": 200,
  "message": "AI Generated Answer Successfully",
  "data": {
    "answer": "FPT duy trì tăng trưởng doanh thu nhờ mảng dịch vụ công nghệ.",
    "isConfident": true,
    "limitations": null,
    "citations": [
      {
        "citationId": 1,
        "documentId": 1,
        "docTitle": "Báo cáo tài chính kiểm toán hợp nhất 2025",
        "sourceUrl": "/api/v1/documents/1/file",
        "locationRef": "Trang 24",
        "excerpt": "Doanh thu và lợi nhuận sau thuế tiếp tục tăng nhờ mảng dịch vụ công nghệ."
      }
    ]
  },
  "error": null
}
```

SSE endpoint `GET /api/v1/chat/stream` vẫn là mục tiêu sau, chưa phải endpoint chính trong skeleton hiện tại.

### 5.1. Quy tắc an toàn của endpoint AI

- `isConfident=true` bắt buộc đi cùng ít nhất một citation canonical.
- AI Service không được tự tạo URL hoặc metadata citation.
- Backend phải xác minh chunk thuộc đúng document `ready` và đúng doanh nghiệp.
- Câu thiếu dữ liệu trả `isConfident=false`; không được biến thành kết luận tài chính chắc chắn.
- `AI_DEMO_MODE=false` là bắt buộc khi nghiệm thu online và production.
- Provider lỗi không được che bằng response demo trong real path.

### 5.2. Mã lỗi công khai của luồng AI

| HTTP | Mã lỗi | Khi nào xảy ra |
|---:|---|---|
| 502 | `AI_SERVICE_UNAVAILABLE` | Backend không kết nối được hoặc AI Service trả lỗi |
| 504 | `AI_SERVICE_TIMEOUT` | AI Service không phản hồi trong timeout của Backend |
| 502 | `AI_INVALID_RESPONSE` | Response không phải JSON hoặc sai contract answer/confidence |
| 502 | `AI_INVALID_EVIDENCE` | Evidence sai identity, không tồn tại hoặc không có citation canonical |

Mã lỗi chi tiết bên trong AI Service và hướng xử lý vận hành được ghi tại [`RAG_KNOWN_LIMITATIONS.md`](RAG_KNOWN_LIMITATIONS.md).

### 5.3. Citation URL

Với tài liệu local, `sourceUrl` là URL tương đối của Backend, ví dụ:

```text
/api/v1/documents/8/file
```

Client nối URL này với origin của Backend. `locationRef` chứa số trang; giao diện có thể mở PDF với fragment `#page=N`, nhưng vẫn phải hiển thị location để người dùng tự đối chiếu.
