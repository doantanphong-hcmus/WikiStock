# Hướng Dẫn Sử Dụng `.env` & Tầm Quan Trọng Của Local Testing

Tài liệu này được viết dành riêng cho team Dev (Nhân, Thắng, Phong) nhằm thống nhất tư duy làm việc chuyên nghiệp, tránh các lỗi sơ đẳng khi làm việc nhóm và bảo mật mã nguồn.

---

## 1. Tại Sao Phải Test local (Chạy thử ở máy cá nhân)?

Nhiều coder có thói quen viết code xong nhắm mắt `git push` lên nhánh `dev` hoặc `main` rồi hy vọng nó sẽ chạy. Đây là một thói quen **cực kỳ nguy hiểm**:

- **Gây cháy server chung:** Nếu code của bạn có bug, nó sẽ làm crash toàn bộ hệ thống mà những người khác đang dùng để test.

- **Khó debug:** Lỗi xảy ra trên môi trường thật rất khó dò. Ở máy local, bạn có thể xem log, dùng debugger thoải mái.

- **Quy tắc:** Code phải chạy mượt ở máy mình (Local) thì mới được phép push lên Git. 

*Để test local được, hệ thống trên máy bạn phải giống y hệt trên server. Đó là lý do chúng ta có Docker Compose và các biến môi trường (`.env`).*

---

## 2. `.env` và `.env.example` là gì? Tại sao phải sinh ra 2 file này?

### `.env` 
Đây là file chứa các **Cấu hình bí mật** (Mật khẩu Database, Secret Key của JWT Auth, API Key của OpenAI/Gemini...).
- **ĐẶC QUYỀN:** File này **TUYỆT ĐỐI KHÔNG BAO GIỜ ĐƯỢC PUSH LÊN GITHUB**. Nếu bạn lỡ push API Key của OpenAI lên Github công khai, chỉ trong 5 phút, các bot quét tự động có thể cắp key của bạn để chạy hàng ngàn USD tiền cước. (File này đã được chặn lại trong file `.gitignore`).
- Mỗi môi trường (Máy của Thắng, Máy của Nhân, và Server Production) sẽ có một file `.env` chứa các giá trị khác nhau (ví dụ: máy Nhân pass là `12345`, nhưng server pass là `SuperSecret@999`).

### `.env.example` (File mẫu)
- File này **CẦN ĐƯỢC PUSH LÊN GITHUB**.
- Nó đóng vai trò là Template. Nó liệt kê mọi biến cần thiết, nhưng để các giá trị giả hoặc để trống.
=> Khi code thì dev cần phải tạo ra một bộ .env riêng trên máy tính cá nhân để thao tác. 
---

## 3. Hướng Dẫn Sử Dụng Trong Dự Án WikiStock

Bất kỳ ai khi clone code mới về, hoặc khi thấy hệ thống báo lỗi thiếu biến môi trường, hãy làm đúng 2 bước sau ở thư mục gốc `WikiStock/`:

**Bước 1: Tạo file .env từ file mẫu**
Nhân bản (copy) file `.env.example` và đổi tên bản sao đó thành `.env`.
- Trên Windows/Mac: Copy paste file `.env.example` và rename thành `.env`
- Dùng Terminal (Linux/Mac):
  ```bash
  cp .env.example .env
  ```

**Bước 2: Điền thông tin thật vào file .env vừa tạo**
Mở file `.env` lên (tuyệt đối không sửa trực tiếp vào file `.env.example`).
- Điền API Key thật của bạn vào (ví dụ: `OPENAI_API_KEY=sk-abc123...`).
- Nếu bạn tự cài Postgres ở ngoài thay vì dùng Docker, hãy đổi `DB_HOST` thành IP thực tế.

---

## 4. Những Nguyên Tắc Sống Còn

> [!WARNING]
**TUYỆT ĐỐI KHÔNG ĐƯỢC PUSH FILE .ENV LÊN GITHUB, nhớ phải để file .env trong .gitignore**