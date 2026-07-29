# Quy chuẩn viết mã WikiStock

> Phiên bản: v1  
> Chủ sở hữu: WikiStock Team  
> Phạm vi: Frontend, Backend, AI Service, Crawler, Database, Tài liệu, CI/CD  
> Mục tiêu: Tài liệu này là kim chỉ nam để giữ codebase WikiStock sạch, dễ đọc, dễ kiểm thử, dễ triển khai và sẵn sàng cho các bước kiểm tra tự động trước khi đưa mã nguồn lên GitHub.

---

## 1. Nguyên tắc cốt lõi

WikiStock là nền tảng tri thức tài chính lấy dữ liệu làm trung tâm. Vì vậy chất lượng mã nguồn phải phục vụ bốn ưu tiên:

1. Dữ liệu tài chính chính xác.
2. Mọi nhận định quan trọng có thể truy vết nguồn.
3. Kiến trúc dễ bảo trì.
4. Demo và triển khai ổn định.

Mỗi thay đổi trong code nên làm hệ thống dễ hiểu hơn, dễ kiểm chứng hơn hoặc an toàn hơn. Nếu một thay đổi làm code phức tạp hơn, pull request phải giải thích rõ lý do và giá trị nhận được.

---

## 2. Cấu trúc repository

Repository được tổ chức theo dạng monorepo:

```text
WikiStock/
├── frontend/        # Next.js, React, TypeScript, TailwindCSS
├── backend/         # NestJS, TypeScript, Prisma, API layer
├── ai-service/      # FastAPI, RAG, LLM, embeddings
├── crawler/         # Thu thập, parse, làm sạch và nạp dữ liệu
├── docs/            # Tài liệu dự án, API contract, quy chuẩn
├── schema.sql       # Nguồn chuẩn tuyệt đối của database
└── compose.yaml
```

Quy định:

- Không trộn trách nhiệm giữa các service.
- Frontend không được kết nối trực tiếp vào database.
- Backend là lớp API chính cho Frontend.
- AI Service cung cấp API nội bộ để Backend gọi.
- Crawler phải ghi dữ liệu đã chuẩn hóa theo đúng `schema.sql`.
- Tài liệu ảnh hưởng đến cách triển khai phải đặt trong `docs/`.

---

## 3. API Contract

API contract được ghi trong `docs/API_CONTRACT.md`.

Quy định:

- Nếu đổi hình dạng response của API, phải cập nhật `docs/API_CONTRACT.md` trong cùng pull request.
- Type ở Frontend phải khớp response từ Backend.
- API response phải rõ ràng và ổn định.
- Không trả raw database object nếu object đó lộ các field nội bộ không cần thiết.
- Không âm thầm đổi ý nghĩa của field trong khi vẫn giữ nguyên tên field.

---

## 4. Quy chuẩn đặt tên chung

Tên biến, hàm, class, bảng và file phải nói rõ ý nghĩa nghiệp vụ.

Nên dùng:

```text
companyName
financialReport
riskSignal
sourceDocument
citation
```

Tránh dùng:

```text
data
item
temp
obj
result2
finalFinal
```

Tên ngắn chỉ được dùng trong phạm vi rất nhỏ, ví dụ `id`, `tx`, `db` hoặc biến lặp đơn giản.

---

## 5. Quy chuẩn Backend

Backend dùng NestJS, TypeScript và Prisma.

### 5.1. Tên file và thư mục

Tên file dùng kebab-case:

```text
companies.service.ts
companies.controller.ts
financial-reports.service.ts
ask-ai.dto.ts
```

Tên thư mục feature dùng số nhiều:

```text
companies/
financials/
citations/
documents/
admin/
```

### 5.2. Class

Class dùng PascalCase:

```ts
CompaniesService
CompaniesController
AskAiDto
FinancialReportsModule
```

### 5.3. Biến và hàm

Biến và hàm dùng camelCase:

```ts
companyId
companyName
findByTicker()
getFinancialReports()
```

### 5.4. Hằng số

Hằng số thật sự dùng UPPER_SNAKE_CASE:

```ts
DEFAULT_PAGE_SIZE
MAX_AI_QUERY_LENGTH
```

Object cấu hình dùng camelCase:

```ts
appConfig
databaseConfig
```

### 5.5. DTO

Request DTO phải kết thúc bằng `Dto`:

```ts
AskAiDto
CreateCompanyDto
UpdateDocumentReviewDto
```

Response DTO, nếu định nghĩa riêng, nên kết thúc bằng `ResponseDto`:

```ts
CompanyProfileResponseDto
FinancialReportResponseDto
```

### 5.6. Prisma model

Prisma dùng tên model PascalCase và field camelCase, sau đó map xuống tên bảng/cột trong SQL:

```prisma
model Company {
  companyId   Int    @id @default(autoincrement()) @map("company_id")
  ticker      String @unique
  companyName String @map("company_name")

  @@map("company")
}
```

Quy định:

- Tên field trong Prisma nên thân thiện với code TypeScript.
- Mapping xuống SQL phải trung thành với `schema.sql`.
- Dùng tên relation rõ ràng khi Prisma không thể tự suy luận chính xác.
- Các bảng nối nhiều-nhiều đã được định nghĩa trong SQL phải được biểu diễn bằng model riêng trong Prisma.

---

## 6. Quy chuẩn Frontend

Frontend dùng Next.js, React, TypeScript và TailwindCSS.

### 6.1. Tên file và thư mục

React component dùng PascalCase:

```text
CompanyHeader.tsx
FinancialTable.tsx
AiAnswerCard.tsx
```

Route folder đi theo quy ước của Next.js:

```text
companies/[ticker]/financials/page.tsx
search/page.tsx
admin/page.tsx
```

API wrapper đặt theo feature:

```text
features/company/api.ts
features/financial/api.ts
features/ai/api.ts
```

### 6.2. Component

Component dùng PascalCase:

```tsx
CompanyHeader
AiAskBox
ErrorState
```

Quy định:

- Mỗi component nên làm một nhiệm vụ rõ ràng.
- Data fetching nên nằm ở page hoặc feature API, trừ khi client component thật sự cần tự gọi.
- Tránh component quá lớn, vừa fetch data, vừa format, vừa layout, vừa xử lý interaction.
- Component dùng chung đặt trong `src/components/common`.

### 6.3. Type

Type và interface dùng PascalCase:

```ts
Company
FinancialReport
SourceDocument
ApiResponse
```

Quy định:

- Type Frontend phải khớp response từ Backend.
- Không lặp lại cùng một type ở nhiều file.
- Type dùng chung đặt trong `src/lib/types.ts` hoặc `types.ts` riêng của feature.

### 6.4. Styling

Mặc định dùng TailwindCSS.

Quy định:

- Tránh inline style object, trừ khi giá trị phải tính động lúc runtime.
- Tránh lồng card trong card quá sâu.
- Dashboard tài chính phải rõ ràng, chuyên nghiệp, dễ đọc.
- Không dùng trang trí làm giảm khả năng đọc số liệu.
- Text không được tràn khỏi button, bảng, card hoặc panel.

---

## 7. Quy chuẩn AI Service

AI Service dùng Python và FastAPI.

### 7.1. Tên file và thư mục

File Python dùng snake_case:

```text
main.py
rag_pipeline.py
citation_builder.py
document_loader.py
```

### 7.2. Biến và hàm

Biến và hàm dùng snake_case:

```py
company_code
source_documents
build_answer()
retrieve_context()
```

### 7.3. Class

Class dùng PascalCase:

```py
AskRequest
AskResponse
Citation
RagPipeline
```

### 7.4. Quy định về đầu ra AI

Câu trả lời AI phải tuân thủ:

- Không trả lời vượt quá dữ liệu hệ thống có.
- Mọi nhận định tài chính quan trọng phải có citation.
- Nếu thiếu bằng chứng, trả về phản hồi không đủ dữ liệu.
- Không đưa khuyến nghị mua/bán trực tiếp.
- Tách riêng câu trả lời, độ tự tin, giới hạn và citation.

---

## 8. Quy chuẩn Crawler

Crawler phải dễ chạy lại, dễ kiểm toán và không làm hỏng dữ liệu.

### 8.1. Tên file

File dùng snake_case:

```text
crawl_company_overview.py
crawl_financial_reports.py
parse_financial_pdf.py
load_to_postgres.py
```

### 8.2. Tên hàm

Tên hàm nên bắt đầu bằng hành động:

```py
fetch_company_overview()
parse_income_statement()
normalize_financial_items()
insert_financial_report()
```

### 8.3. Quy định dữ liệu

- Dữ liệu thô không được ghi đè dữ liệu đã chuẩn hóa.
- Mỗi bản ghi crawl được nên giữ metadata nguồn.
- Mỗi số liệu tài chính quan trọng phải truy được về tài liệu, URL hoặc citation.
- Script crawler nên idempotent nếu có thể, tức chạy lại không tạo dữ liệu trùng vô tội vạ.
- Không hardcode thông tin đăng nhập database.
- Không chạy vòng lặp scraping thiếu kiểm soát.

---

## 9. Quy định comment

Comment dùng để giải thích "vì sao", không lặp lại "code đang làm gì".

Nên viết:

```ts
// Báo cáo năm có fiscalQuarter = null trong SQL, nên cần query riêng.
```

Tránh viết:

```ts
// Gán companyId bằng company.id
companyId = company.id;
```

Quy định:

- Comment nên dùng cho business rule, công thức tài chính, ràng buộc schema hoặc tradeoff không hiển nhiên.
- Không để code đã comment lại trong source.
- Không dùng comment để bù cho tên biến/hàm kém rõ ràng.
- TODO phải có người phụ trách hoặc lý do.

Định dạng TODO khuyến nghị:

```ts
// TODO(Phong): Thay demo response bằng RAG retrieval sau khi vector store sẵn sàng.
```

---

## 10. Quy định environment và secret

Secret tuyệt đối không được commit.

Quy định:

- Không commit `.env`.
- Không commit mật khẩu Supabase, JWT secret, API key hoặc service role key.
- Chỉ commit `.env.example` với placeholder.
- Placeholder phải rõ ràng:

```env
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<YOUR_PASSWORD>@<POOLER_HOST>:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:<YOUR_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
JWT_SECRET=replace_with_local_dev_secret
```

- Dùng credential riêng cho local development, staging và production.
- Nếu secret bị lộ, phải rotate ngay.

---

## 11. Quy định xử lý lỗi

Backend API error nên đi theo contract của dự án:

```json
{
  "statusCode": 404,
  "message": "Company not found",
  "data": null,
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "details": "Company FPT was not found"
  }
}
```

Quy định:

- Dùng error code ổn định để máy đọc được.
- Không trả stack trace, database credential hoặc secret cho client.
- Frontend hiển thị thông báo thân thiện cho người dùng.
- Log có thể chứa chi tiết cho developer, nhưng không chứa secret.

---

## 12. Quy định logging

Log phải giúp debug dữ liệu và AI.

Quy định:

- Log ingestion run, AI request ID, source document ID và lý do lỗi.
- Không log password, JWT token, API key hoặc Supabase URL đầy đủ.
- Khi external service lỗi, log đủ ngữ cảnh để retry an toàn.
- Ưu tiên structured log nếu có thể.

---

## 13. Quy định kiểm thử

Mỗi hành vi quan trọng phải có cách kiểm chứng thực tế.

### 13.1. Backend

Các lệnh kiểm tra bắt buộc:

```bash
npm run build
npm test
```

Nên kiểm thử:

- Hình dạng API response.
- Service behavior khi tìm thấy và không tìm thấy dữ liệu.
- Prisma query mapping.
- Định dạng error response.

### 13.2. Frontend

Các lệnh kiểm tra bắt buộc:

```bash
npm run build
npm run lint
```

Nên kiểm thử:

- Page render đúng.
- Empty, loading và error state.
- Xử lý lỗi API.
- Layout với text dài.

### 13.3. AI Service

Lệnh kiểm tra khuyến nghị:

```bash
python -m compileall .
```

Nên kiểm thử:

- Hành vi khi thiếu dữ liệu.
- Định dạng citation.
- Validation request/response.
- Chống prompt injection ở mức cơ bản.

### 13.4. Crawler

Nên kiểm thử:

- Happy path cho một ticker.
- Trường hợp thiếu dữ liệu.
- Chạy lại không tạo dữ liệu trùng.
- Giữ URL nguồn và citation.
- Chuẩn hóa giá trị tài chính.

---

## 14. Quy định Git và Pull Request

### 14.1. Tên branch

Dùng mẫu:

```text
feat/company-profile-db
fix/ai-timeout-fallback
docs/coding-convention
chore/prisma-sync
```

### 14.2. Commit message

Dùng Conventional Commits:

```text
feat: add company profile API
fix: handle missing financial report
docs: add coding convention
chore: sync prisma schema with sql
test: add company service tests
```

### 14.3. Checklist trước khi yêu cầu review

- Code build được.
- Test pass.
- Không commit secret.
- API contract đã cập nhật nếu response shape thay đổi.
- Schema change đã được giải thích.
- Frontend có empty/loading/error state.
- AI có citation hoặc phản hồi không đủ dữ liệu.

---

## 15. Quality gate cho CI/CD

CI phải fail nếu check bắt buộc fail.

Các check khuyến nghị:

### Backend

```bash
cd backend
npm ci
npm run build
npm test
```

### Frontend

```bash
cd frontend
npm ci
npm run build
npm run lint
```

### AI Service

```bash
cd ai-service
python -m compileall .
```

### Bảo mật repository

Nên có kiểm tra tự động:

- Phát hiện `.env` bị commit.
- Phát hiện pattern secret phổ biến.
- Kiểm tra format.
- Kiểm tra TypeScript build.
- Kiểm tra API contract khi backend response type thay đổi.

---

## 17. Definition of Done

Một task chỉ được xem là xong khi:

- Hành vi mong muốn hoạt động.
- Type liên quan đã cập nhật.
- Tài liệu liên quan đã cập nhật.
- Build và test pass.
- Không commit secret hoặc file chỉ dùng local.
- Implementation tuân thủ `schema.sql` và API contract.
- Reviewer có thể hiểu thay đổi mà không cần hỏi lại bối cảnh bị thiếu.

---

## 18. Quy định bắt buộc riêng cho WikiStock

Các quy định sau là bắt buộc:

1. `schema.sql` là nguồn chuẩn của database.
2. AI không được bịa số liệu tài chính.
3. Nhận định AI quan trọng phải có citation.
4. Không đưa khuyến nghị mua/bán trực tiếp.
5. Không đưa secret lên Git.
6. Frontend phải xử lý empty, loading và error state.
7. Crawler phải giữ thông tin nguồn.
8. Backend không được trả response shape thiếu nhất quán cho cùng một endpoint.
9. Code ưu tiên rõ ràng hơn thông minh quá mức.
10. Demo phải ổn định trước khi thêm tính năng mới.
