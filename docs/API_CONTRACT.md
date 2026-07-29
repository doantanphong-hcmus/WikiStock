# WikiStock API Contract (V1)

Tài liệu này quy định API contract giữa các service trong hệ thống WikiStock, chủ yếu là **Frontend ↔ Backend** và **Backend ↔ AI Service**.

Nguyên tắc hiện tại:

- JSON response dùng `camelCase`.
- Response shape đi gần `schema.sql` mới.
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
    "citations": [
      {
        "citationId": 1,
        "documentId": 1,
        "docTitle": "Báo cáo tài chính kiểm toán hợp nhất 2025",
        "sourceUrl": "https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf",
        "locationRef": "Trang 24",
        "excerpt": "Doanh thu và lợi nhuận sau thuế tiếp tục tăng nhờ mảng dịch vụ công nghệ."
      }
    ]
  },
  "error": null
}
```

Khi thiếu dữ liệu, AI phải trả lời không đủ dữ liệu và để `citations` là mảng rỗng.

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

### 3.5. Citation Theo Doanh Nghiệp

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

### 3.6. Admin Data Status

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
      "sourceStatus": "mock",
      "lastUpdated": "2026-07-09"
    }
  ],
  "error": null
}
```

---

## 4. Xác Thực

Auth chưa hoàn thiện trong skeleton hiện tại. Khi triển khai, response user nên đi gần bảng `app_user`:

```json
{
  "userId": 1,
  "email": "thang@wikistock.vn",
  "fullName": "Thắng",
  "role": {
    "roleId": 1,
    "roleName": "admin"
  }
}
```

---

## 5. AI Web-Facing

Skeleton hiện tại dùng:

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

Response dùng cùng shape với mục **2.1**.

SSE endpoint `GET /api/v1/chat/stream` vẫn là mục tiêu sau, chưa phải endpoint chính trong skeleton hiện tại.
