# WikiStock - Nền Tảng Tri Thức Tài Chính Tích Hợp AI

Chào mừng đến với repository của dự án **WikiStock** - sản phẩm được phát triển cho cuộc thi **Attacker 2026**.

## Giới Thiệu Dự Án

WikiStock là nền tảng tri thức tài chính tích hợp AI dành cho thị trường chứng khoán Việt Nam. Khác với các ứng dụng giao dịch hoặc chatbot AI thông thường, WikiStock được định vị như một Wikipedia cho doanh nghiệp niêm yết. 

Dự án giải quyết bài toán thiếu hụt một nơi duy nhất để người dùng phổ thông có thể tra cứu, hiểu và so sánh thông tin doanh nghiệp một cách minh bạch. Điểm khác biệt lớn nhất của WikiStock nằm ở tính năng **AI Analyst**: câu trả lời tự tin phải dựa trên luồng RAG và kèm trích dẫn từ tài liệu nguồn. Cơ chế này giúp người dùng kiểm chứng thông tin và giảm rủi ro AI trả lời thiếu căn cứ; nó không được xem là cam kết loại bỏ hoàn toàn hallucination.

## Đội Ngũ Thực Hiện

Dự án là sự kết hợp chặt chẽ giữa khối Kỹ thuật và khối Nghiệp vụ kinh tế:

### Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM
*   **Nguyễn Việt Thắng** - *Data Engineer, DevOps:* Chịu trách nhiệm thiết lập luồng thu thập dữ liệu (ETL), quản trị database, hệ thống Docker và CI/CD.
*   **Đoàn Tấn Phong** - *Data Scientist, ML Engineer:* Đảm nhận xây dựng thuật toán RAG, tinh chỉnh pipeline AI và xử lý dữ liệu ngôn ngữ tự nhiên.
*   **Phan Lê Thành Nhân** - *Fullstack Developer:* Phát triển giao diện tương tác Frontend và xây dựng cổng kết nối API Backend.
*   **Võ Ngọc Bảo Trân** - *Business Analyst, UI/UX, QA:* Phân tích yêu cầu, thiết kế trải nghiệm người dùng (Figma) và kiểm thử chất lượng hệ thống.

### Trường Đại học Kinh tế - Luật - ĐHQG TP.HCM
*   **Nguyễn Như Quỳnh** - *Product Owner:* Định hình mô hình kinh doanh, nghiên cứu công thức tài chính và đảm bảo tính đúng đắn về mặt kinh tế của các đầu ra AI.

## 📂 Cấu Trúc Mã Nguồn 

Dự án được tổ chức theo kiến trúc Monorepo để tối ưu hóa quá trình phát triển song song của nhóm. Dưới đây là cấu trúc thư mục hiện tại:

```text
WikiStock/
├── frontend/           # Next.js, React, TailwindCSS (Giao diện Web App)
├── backend/            # NestJS, TypeScript (Cổng API nghiệp vụ, xác thực)
├── ai-service/         # Python, FastAPI, PostgreSQL/pgvector (AI & RAG)
├── crawler/            # Thu thập dữ liệu doanh nghiệp và tài chính
├── docs/               # API contract, runbook và tài liệu nguồn
├── scripts/ocr/        # Tiền xử lý OCR cho PDF scan
├── .gitignore          # Ẩn các file environment và dependencies
└── README.md           # Tài liệu dự án (bạn đang đọc file này)
```

## Cổng phát triển local

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/health
- Backend API v1: http://localhost:3001/api/v1
- AI service: http://localhost:8000

## Chạy nhanh bằng Docker Compose

Quy trình đầy đủ cho cả Docker và native Windows nằm trong
[runbook Backend V1](docs/BACKEND_V1_RUNBOOK.md). Bản chạy nhanh bằng Compose:

```powershell
Copy-Item .env.example .env
# Mở .env và thay JWT_SECRET bằng chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
docker compose up -d --build
docker compose ps --all
```

Compose chờ PostgreSQL sẵn sàng, chạy migration và seed dữ liệu tham chiếu, kiểm tra pgvector rồi mới khởi động Backend và AI Service.

```powershell
docker compose down
```

Mặc định `AI_PROVIDER=demo`, vì vậy chế độ này không gọi provider AI và luôn trả kết quả không tự tin. Để chạy RAG online hoặc dựng pipeline từ database sạch, làm theo [runbook vận hành RAG](docs/RAG_OPERATIONS_RUNBOOK.md).

## Chạy từng service ngoài Docker

Không chạy các service trước khi PostgreSQL, pgvector, migration và các file `.env`
native đã sẵn sàng. Làm theo [quy trình native Windows](docs/BACKEND_V1_RUNBOOK.md#5-dựng-native-trên-windows) để dùng đúng thứ tự và URL của từng môi trường.

## Tài liệu vận hành

- [Checklist demo chatbot cho khách hàng](docs/CHAT_CUSTOMER_DEMO_CHECKLIST.md)
- [Runbook dựng, kiểm tra và demo Backend V1](docs/BACKEND_V1_RUNBOOK.md)
- [Cổng kiểm tra trước khi merge và phát hành](docs/CI_RELEASE_GATES.md)
- [Runbook RAG từ database sạch](docs/RAG_OPERATIONS_RUNBOOK.md)
- [Giới hạn đã biết và cách xử lý lỗi](docs/RAG_KNOWN_LIMITATIONS.md)
- [API contract](docs/API_CONTRACT.md)
- [Tiền xử lý OCR](docs/OCR_PREPROCESSING.md)
- [Rủi ro độ tin cậy sau R8](docs/R8_POST_EVALUATION_RISK.md)

## Nguyên tắc an toàn

- Không commit `.env`, API key, token, cache model hoặc output OCR.
- Không dùng chế độ demo để chứng minh RAG/provider thật đang hoạt động.
- Không hiển thị câu trả lời tài chính như đã được xác minh khi thiếu citation hợp lệ.
- Luôn mở PDF và đối chiếu đúng trang trước khi nghiệm thu thủ công.
