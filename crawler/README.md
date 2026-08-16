# WikiStock VNStock Crawler

Crawler lấy hồ sơ doanh nghiệp, dữ liệu tài chính và tin tức từ VNStock rồi cập nhật vào PostgreSQL của WikiStock.

## Trách nhiệm của crawler

Crawler chỉ làm ba việc: lấy dữ liệu, chuẩn hóa dữ liệu và ghi theo cơ chế upsert. Crawler **không tạo bảng, không chạy migration và không seed dữ liệu nền**. Prisma Migrate trong `backend/` là nơi duy nhất quản lý cấu trúc cơ sở dữ liệu.

## Chuẩn bị

Yêu cầu Python 3.12 x64 và PostgreSQL đã được Backend khởi tạo.

```powershell
cd backend
npm run db:bootstrap

cd ..\crawler
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Cấu hình kết nối qua biến môi trường. Crawler ưu tiên `DATABASE_URL`; nếu không có thì dùng `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

```powershell
$env:DATABASE_URL='postgresql://app_user:app_password@localhost:5432/app_db'
.\.venv\Scripts\python.exe check_requirements.py
```

Không commit file `.env`. File `.env.example` chỉ là mẫu tên biến.

## Chạy crawler

Nghiệm thu một mã FPT trước:

```powershell
.\.venv\Scripts\python.exe main.py --ticker FPT
```

Sau khi FPT đạt yêu cầu, chạy đủ 10 mã demo:

```powershell
.\.venv\Scripts\python.exe main.py
```

Có thể chạy độc lập từng công đoạn:

```powershell
.\.venv\Scripts\python.exe main.py --ticker FPT --stage company
.\.venv\Scripts\python.exe main.py --ticker FPT --stage financial
.\.venv\Scripts\python.exe main.py --ticker FPT --stage news
```

Nếu một mã hoặc một công đoạn lỗi, các mã còn lại vẫn tiếp tục. Cuối lần chạy, CLI in bản tổng kết và ghi một dòng vào `data_ingestion_log`. Mã thoát là `0` khi tất cả thành công, `1` khi có lỗi dữ liệu/API và `2` khi môi trường hoặc schema chưa sẵn sàng.

Tin tức chỉ được lưu khi nguồn trả về URL tuyệt đối bắt đầu bằng `http://` hoặc `https://`. Crawler không ghép tên miền và không tạo URL dự đoán.

## Kiểm thử offline

Bộ test ánh xạ không gọi VNStock và không cần database:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Fixture nhỏ trong `tests/fixtures/` kiểm tra các quy tắc dễ hỏng: ánh xạ hồ sơ, chọn bốn quý gần nhất, loại `NULL`/`NaN`/vô cực, chuẩn hóa phần trăm và xác thực URL tin tức.

## Cấu trúc

- `main.py`: CLI và tổng kết lần chạy.
- `crawl_company.py`: hồ sơ, sàn giao dịch và ngành.
- `crawl_financial.py`: báo cáo và chỉ số tài chính.
- `crawl_news.py`: tin tức doanh nghiệp.
- `mappings.py`: quy tắc chuẩn hóa có thể test offline.
- `db.py`: kết nối, kiểm tra schema và các lệnh upsert.
- `check_requirements.py`: kiểm tra Python, thư viện và database.
