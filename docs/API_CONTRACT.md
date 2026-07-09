# WikiStock API Contract (V1)

Tài liệu này quy định hợp đồng giao tiếp (API Contract) giữa các services trong hệ thống WikiStock (chủ yếu giữa **Frontend ↔ Backend (NestJS)** và **Backend (NestJS) ↔ AI Service (FastAPI)**).

---

## 1. Tiêu chuẩn chung (General Standards)

Mọi API response (ngoại trừ file download hoặc stream) đều phải trả về với HTTP Status 200 (nếu xử lý thành công) hoặc 400/500 (nếu có lỗi hệ thống), và tuân theo cấu trúc JSON gốc (Envelope) sau:

### 1.1. Cấu trúc Trả về Thành công (Success Response)
```json
{
  "statusCode": 200,
  "message": "Mô tả ngắn gọn kết quả (ví dụ: Success, Fetched)",
  "data": { ... }, // Object hoặc Array dữ liệu
  "error": null
}
```

### 1.2. Cấu trúc Trả về Lỗi (Error Response)
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

API này do **FastAPI (AI Service)** cung cấp. NestJS sẽ gọi sang API này để lấy kết quả phân tích AI.

### 2.1. Yêu cầu AI Phân tích (AI Analyst)
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

API này do **NestJS (Backend)** cung cấp cho Web App (Next.js) hiển thị dữ liệu.

### 3.1. Lấy thông tin cơ bản Doanh nghiệp (Company Profile)
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

### 3.2. Lấy dữ liệu tài chính chuẩn hóa (Financial Data)
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
```
