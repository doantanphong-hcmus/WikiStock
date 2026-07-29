# WikiStock API Contract (V1)

Tài liệu này quy định API Contract giữa các services trong hệ thống WikiStock (chủ yếu giữa **Frontend ↔ Backend** và **Backend↔ AI Service**).

---

## 1. Tiêu chuẩn chung 

Mọi API response (ngoại trừ file download hoặc stream) đều phải trả về với HTTP Status 200 (nếu xử lý thành công) hoặc 400/500 (nếu có lỗi hệ thống), và tuân theo cấu trúc JSON gốc sau:

### 1.1. Cấu trúc Trả về Success Response
```json
{
  "statusCode": 200,
  "message": "Mô tả ngắn gọn kết quả (ví dụ: Success, Fetched)",
  "data": { ... }, // Object hoặc Array dữ liệu
  "error": null
}
```

### 1.2. Cấu trúc Trả về Error Response
```json
{
  "statusCode": 400, // 400, 401, 403, 404, 500
  "message": "Mô tả lỗi cho người dùng cuối (ví dụ: Thiếu mã cổ phiếu)",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "Chi tiết lỗi dành cho developer debug"
  }
}
```

> **Quy tắc:**
> *   Dùng **camelCase** cho mọi key trong JSON.
> *   Frontend chỉ check trường `statusCode` và `error` để biết request có thành công hay không.

---

## 2. API Giao tiếp Nội bộ (Backend ↔ AI Service)

API này do **FastAPI** cung cấp. NestJS sẽ gọi sang API này để lấy kết quả phân tích AI.

### 2.1. Yêu cầu AI Phân tích
*   **Endpoint:** `POST /api/v1/internal/ai/ask`
*   **Mô tả:** Xử lý luồng RAG, tìm kiếm tài liệu, và trả về câu trả lời có trích dẫn.

**Request Payload:**
```json
{
  "query": "Chi phí quản lý doanh nghiệp trong năm 2025 có sự bất thường nào không?",
  "companyCode": "FPT",
  "filters": {
    "year": 2025,
    "documentTypes": ["financial_statement", "annual_report"]
  },
  "conversationId": "uuid-1234-5678" // Trống nếu là câu hỏi đầu tiên
}
```

**Response Payload (Thành công & Có dữ liệu):**
```json
{
  "statusCode": 200,
  "message": "AI Generated Answer Successfully",
  "data": {
    "answer": "Trong năm 2025, chi phí quản lý doanh nghiệp của FPT đạt 3.500 tỷ VNĐ, tăng 12% so với năm 2024. Sự gia tăng này chủ yếu đến từ chi phí nhân viên và các khoản dự phòng [1]. Không có sự bất thường đáng kể nào vi phạm quy định tài chính.",
    "isConfident": true,
    "citations": [
      {
        "id": "ref-01",
        "docTitle": "Báo cáo tài chính kiểm toán hợp nhất 2025",
        "sourceUrl": "https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf",
        "pageNumber": 24,
        "matchedText": "Chi phí quản lý doanh nghiệp tăng 12% do tăng chi phí nhân sự..."
      }
    ]
  },
  "error": null
}
```

**Response Payload (Từ chối trả lời vì thiếu dữ liệu):**
```json
{
  "statusCode": 200,
  "message": "Insufficient Data for AI",
  "data": {
    "answer": "Dữ liệu hiện tại của hệ thống không có báo cáo tài chính liên quan đến chi phí quản lý doanh nghiệp của FPT trong năm 2025 để tôi có thể phân tích.",
    "isConfident": false,
    "citations": []
  },
  "error": null
}
```

---

## 3. API Giao tiếp Hệ thống (Frontend ↔ Backend)

API này do **NestJS** cung cấp cho Web App (Next.js) hiển thị dữ liệu.

### 3.1. Lấy thông tin cơ bản Doanh nghiệp (hỗ trợ Module Company Profile)
*   **Endpoint:** `GET /api/v1/companies/:companyCode/profile`
*   **Mô tả:** Trả về hồ sơ doanh nghiệp (ngành nghề, vốn, thông tin niêm yết).

**Response Payload:**
```json
{
  "statusCode": 200,
  "message": "Fetched company profile",
  "data": {
    "companyCode": "FPT",
    "name": "Công ty Cổ phần FPT",
    "exchange": "HOSE",
    "industry": "Công nghệ thông tin",
    "summary": "Tập đoàn công nghệ hàng đầu Việt Nam...",
    "website": "https://fpt.com",
    "ceo": "Nguyễn Văn Khoa"
  },
  "error": null
}
```

### 3.2. Lấy dữ liệu tài chính chuẩn hóa 
*   **Endpoint:** `GET /api/v1/companies/:companyCode/financials?year=2025&quarter=4`
*   **Mô tả:** Lấy dữ liệu bảng cân đối, kết quả kinh doanh.

**Response Payload:**
```json
{
  "statusCode": 200,
  "message": "Fetched financial data",
  "data": {
    "companyCode": "FPT",
    "year": 2025,
    "quarter": 4,
    "revenue": 50000000000,
    "netProfit": 8000000000,
    "totalAssets": 70000000000,
    "liabilities": 30000000000,
    "equity": 40000000000
  },
  "error": null
}

### 3.3. Lấy Lịch sử Dữ liệu Tài chính (Biểu đồ)
*   **Endpoint:** `GET /api/v1/companies/:companyCode/financials/history?quarters=4`
*   **Mô tả:** Trả về mảng dữ liệu tài chính của nhiều quý liên tiếp để vẽ biểu đồ "Hiệu quả kinh doanh".

**Response Payload:**
```json
{
  "statusCode": 200,
  "message": "Fetched financial history",
  "data": [
    { "quarter": "Q1/2025", "revenue": 45000000000, "netProfit": 7000000000 },
    { "quarter": "Q2/2025", "revenue": 48000000000, "netProfit": 7500000000 },
    { "quarter": "Q3/2025", "revenue": 49000000000, "netProfit": 7800000000 },
    { "quarter": "Q4/2025", "revenue": 50000000000, "netProfit": 8000000000 }
  ],
  "error": null
}
```

### 3.4. Lấy Điểm Rủi ro (Radar Cảnh báo)
*   **Endpoint:** `GET /api/v1/companies/:companyCode/risk-score`
*   **Mô tả:** Lấy mức độ rủi ro tổng thể và các tín hiệu cảnh báo.

**Response Payload:**
```json
{
  "statusCode": 200,
  "message": "Fetched risk score",
  "data": {
    "companyCode": "FPT",
    "riskLevel": "AN_TOAN", // AN_TOAN, CHU_Y, CANH_BAO
    "score": 85,
    "signals": [
      {
        "signalType": "Tăng trưởng doanh thu chậm",
        "description": "Doanh thu Q4 tăng nhưng biên lợi nhuận giảm",
        "severity": "LOW"
      }
    ]
  },
  "error": null
}
```

### 3.5. Lấy Tin tức Sự kiện
*   **Endpoint:** `GET /api/v1/companies/:companyCode/news`
*   **Mô tả:** Lấy danh sách tin tức liên quan đến công ty.

**Response Payload:**
```json
{
  "statusCode": 200,
  "message": "Fetched news",
  "data": [
    {
      "id": 1,
      "title": "FPT lọt top công ty công nghệ lớn nhất",
      "url": "https://...",
      "publishedAt": "2025-10-15T10:00:00Z"
    }
  ],
  "error": null
}
```

---

## 4. API Xác thực (Authentication)

### 4.1. Đăng ký & Đăng nhập
*   **Endpoints:** 
    - `POST /api/v1/auth/register` (body: email, password, name)
    - `POST /api/v1/auth/login` (body: email, password)
*   **Mô tả:** Trả về JWT Token để truy cập các API yêu cầu xác thực.

**Response Payload (Thành công):**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUz...",
    "user": {
      "id": 1,
      "name": "Thắng",
      "email": "thang@wikistock.vn"
    }
  },
  "error": null
}
```

---

## 5. API Trợ lý AI (Web-Facing)

### 5.1. Hỏi đáp AI (Server-Sent Events)
*   **Endpoint:** `GET /api/v1/chat/stream?query=Tạo_sao_chi_phí_tăng&companyCode=FPT`
*   **Header Required:** `Authorization: Bearer <token>`
*   **Mô tả:** API trả về luồng dữ liệu (Stream) dạng `text/event-stream` để Frontend làm hiệu ứng gõ chữ (typing). Dữ liệu cuối cùng của stream sẽ kèm theo Citations.

**Định dạng Data Stream (SSE):**
```text
data: {"chunk": "Trong năm 2025,"}
data: {"chunk": " chi phí quản lý của FPT đạt 3.500 tỷ..."}
data: {"citations": [{"docTitle": "BCTC Q4", "pageNumber": 24}]}
data: [DONE]
```
```
