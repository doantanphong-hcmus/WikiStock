# WikiStock - Nền Tảng Tri Thức Tài Chính Tích Hợp AI

Chào mừng đến với repository của dự án **WikiStock** - sản phẩm được phát triển cho cuộc thi **Attacker 2026**.

## Giới Thiệu Dự Án

WikiStock là nền tảng tri thức tài chính tích hợp AI dành cho thị trường chứng khoán Việt Nam. Khác với các ứng dụng giao dịch hoặc chatbot AI thông thường, WikiStock được định vị như một Wikipedia cho doanh nghiệp niêm yết. 

Dự án giải quyết bài toán thiếu hụt một nơi duy nhất để người dùng phổ thông có thể tra cứu, hiểu và so sánh thông tin doanh nghiệp một cách minh bạch. Điểm khác biệt lớn nhất của WikiStock nằm ở tính năng **AI Analyst**: mọi câu trả lời do AI tạo ra đều dựa trên luồng RAG và bắt buộc phải **kèm theo trích dẫn nguồn** từ các tài liệu chính thống (BCTC, cáo bạch, nghị quyết...), giúp loại bỏ hoàn toàn rủi ro AI bị Hallucination.

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
├── ai-service/         # Python, FastAPI, LangChain (Luồng xử lý AI & RAG)
├── .gitignore          # Ẩn các file environment và dependencies
└── README.md           # Tài liệu dự án (bạn đang đọc file này)
```

## Local Development Ports

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/health
- Backend API v1: http://localhost:3001/api/v1
- AI service: http://localhost:8000

## Chạy Local Skeleton

Toàn bộ stack:

```bash
cp .env.example .env
docker compose up --build
```

```bash
docker compose down
```

Chạy từng service ngoài Docker:

```bash
cd backend
npm install
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
