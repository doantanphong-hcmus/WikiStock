# Kế Hoạch Phát Triển 30 Ngày (WikiStock V1)

Bảng kế hoạch này được thiết kế theo phương pháp Agile/Scrum, nén lộ trình dự án lại trong 30 ngày (Dự kiến: **09/07/2026 - 08/08/2026**). Kế hoạch chia làm 4 Sprint, giúp team có sẵn 1 tuần buffer để fix bug và tập dượt trước deadline nộp bài (15/08/2026).

---

## Tổng quan Lộ trình (Roadmap)

| Sprint | Thời gian | Tên Giai Đoạn | Mục tiêu cốt lõi (Sprint Goal) |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Ngày 1 - 7 | **Khởi tạo & Dữ liệu Mồi** | Setup xong hạ tầng, chốt luồng Figma, cào xong dữ liệu của 5-10 mã cổ phiếu demo. |
| **Sprint 2** | Ngày 8 - 14 | **Xây dựng Nền tảng** | Code xong luồng Web cơ bản (NextJS) và API lấy dữ liệu (NestJS). AI chạy thử được ở Local. |
| **Sprint 3** | Ngày 15 - 23 | **Tích hợp & AI Citation** | Nối thông suốt 3 hệ thống (Web -> Backend -> AI). AI trả lời mượt mà, hiển thị rõ trích dẫn nguồn trên UI. |
| **Sprint 4** | Ngày 24 - 30 | **Đánh bóng & Chuẩn bị Pitching** | Freeze code (Không thêm tính năng mới). Tập trung fix bug, dọn dẹp UI, viết slide thuyết trình. |

---

## Chi tiết Phân công (Kanban Board)

### 🏃 Sprint 1: Khởi tạo & Dữ liệu Mồi (Ngày 1 - 7)
*Mục tiêu: Đảm bảo mọi người không bị block bởi nhau.*

| Thành viên | Đầu việc cụ thể | Kết quả kỳ vọng (Deliverable) |
| :--- | :--- | :--- |
| **Quỳnh (PO)** | Chốt danh sách 10 mã cổ phiếu demo. Chuẩn bị "10 Câu hỏi vàng" test AI. | File Docs danh sách mã & câu hỏi. |
| **Trân (BA/UI)** | Vẽ Figma tĩnh cho Trang Chủ, Hồ sơ công ty và Chat AI. | Bản thiết kế Figma (Wireframe). |
| **Thắng (Data/Ops)**| Viết `docker-compose`. Cào BCTC và tin tức của 10 mã cổ phiếu demo. | Database Postgres có dữ liệu thật. |
| **Nhân (Dev)** | Setup kết nối Prisma (ORM). Viết API trả về dữ liệu tĩnh cho UI. | API Company & Financial chạy được. |
| **Phong (AI)** | Dựng khung Langchain. Nhét tài liệu PDF của 10 mã vào Vector DB. | AI chạy test được trên terminal. |

### 🏃 Sprint 2: Xây dựng Nền tảng (Ngày 8 - 14)
*Mục tiêu: Có hình hài sản phẩm (Click được).*

| Thành viên | Đầu việc cụ thể | Kết quả kỳ vọng (Deliverable) |
| :--- | :--- | :--- |
| **Quỳnh & Trân** | Bắt đầu viết dàn ý Thuyết trình (Pitching). Review giao diện Nhân đang code. | Sườn Slide, Feedback giao diện. |
| **Thắng (Data/Ops)**| Xử lý luồng crawl định kỳ. Hỗ trợ Phong xử lý dữ liệu tin tức. | Pipeline thu thập dữ liệu ổn định. |
| **Nhân (Dev)** | Code giao diện bằng React/Next.js theo Figma. Gắn API vào UI. | Web hiện được hồ sơ công ty. |
| **Phong (AI)** | Xây dựng API `/ask` nhận JSON, xử lý RAG và trả JSON. | API AI sẵn sàng cho NestJS gọi. |

### 🏃 Sprint 3: Tích hợp & Trích dẫn AI (Ngày 15 - 23)
*Mục tiêu: Nút thắt khó nhất - "Nối mạng" toàn hệ thống.*

| Thành viên | Đầu việc cụ thể | Kết quả kỳ vọng (Deliverable) |
| :--- | :--- | :--- |
| **Quỳnh & Trân** | Liên tục chat nghiệm thu với AI. Đánh giá xem AI trả lời đúng nghiệp vụ không. | Danh sách Bug của AI. |
| **Thắng (Data/Ops)**| Đóng gói code lên server (Vercel cho Web, Railway/Render cho Backend). | Có link chạy thật trên Internet. |
| **Nhân (Dev)** | Viết tính năng khung Chat trên Web. Nối API NestJS sang FastAPI. | Chatbot trên Web hoạt động. |
| **Phong (AI)** | Tinh chỉnh prompt để ép AI phải sinh `citations` (Nguồn: trang mấy, link gì). | AI không bịa chuyện. |

### 🏃 Sprint 4: Đánh bóng & Pitching (Ngày 24 - 30)
*Mục tiêu: Đóng gói sản phẩm hoàn hảo, thuyết phục giám khảo.*

| Thành viên | Đầu việc cụ thể | Kết quả kỳ vọng (Deliverable) |
| :--- | :--- | :--- |
| **Quỳnh (PO)** | Hoàn thiện Slide Pitching. Lên kịch bản Demo hệ thống (Click vào đâu, hỏi câu gì). | Slide & Kịch bản hoàn chỉnh. |
| **Trân (BA/UI)** | Fix các lỗi lệch CSS, sai màu, text quá dài trên giao diện. | UI chuẩn chỉ, chuyên nghiệp. |
| **Thắng (Data/Ops)**| Đảm bảo hệ thống không bị sập. Tắt các log thừa. | Server chạy mượt. |
| **Nhân & Phong** | Dừng thêm tính năng. Chỉ sửa bug nghiêm trọng. Trực hệ thống. | Zero Critical Bugs. |

---

> [!IMPORTANT]
> **Quy Tắc Sống Còn:**
> 1. **Code Freeze:** Sau ngày thứ 23, tuyệt đối không ai được thêm tính năng mới. Nếu tính năng nào chưa làm xong (ví dụ: Risk Center), chấp nhận bỏ luôn khỏi V1 để giữ sản phẩm mượt mà nhất.
> 2. **Daily Sync:** Họp 15 phút mỗi tối. Ai đang bị "tắc" phải báo ngay để cả team hỗ trợ, không được giấu lỗi.
