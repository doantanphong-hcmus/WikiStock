# WikiStock Data Crawler

Crawler lấy hồ sơ doanh nghiệp và dữ liệu tài chính từ VNStock, đồng thời lấy tin tức từ RSS chính thức của các tòa soạn rồi cập nhật vào PostgreSQL của WikiStock.

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
.\.venv\Scripts\python.exe main.py --stage news
```

Tin RSS chạy theo batch: mỗi feed chỉ được tải một lần, sau đó cùng tập bài được đối chiếu với một mã hoặc toàn bộ 10 mã. Mỗi tòa soạn có kết quả và `data_ingestion_log` riêng; một nguồn lỗi không dừng các nguồn còn lại.

Staging/production chạy RSS mỗi giờ bằng lịch hệ điều hành. Script có khóa PostgreSQL chống hai lượt chạy trùng, công cụ kiểm tra sức khỏe và lệnh chạy lại riêng một nguồn. Hướng dẫn cài lịch, xử lý cảnh báo và rollback nằm tại [`docs/RSS_NEWS_OPERATIONS_RUNBOOK.md`](../docs/RSS_NEWS_OPERATIONS_RUNBOOK.md).

Nếu một mã hoặc một công đoạn lỗi, các phần còn lại vẫn tiếp tục. Mã thoát là `0` khi tất cả thành công, `1` khi có lỗi dữ liệu/API và `2` khi môi trường hoặc schema chưa sẵn sàng.

Tin tức chỉ được lưu khi RSS trả về URL tuyệt đối thuộc hostname đã duyệt. Crawler không ghép tên miền, không tạo URL dự đoán và không còn gọi API tin tức của VNStock.

## Kiểm thử offline

Bộ test ánh xạ không gọi VNStock và không cần database:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Fixture nhỏ trong `tests/fixtures/` kiểm tra các quy tắc dễ hỏng: ánh xạ hồ sơ, chọn bốn quý gần nhất, loại `NULL`/`NaN`/vô cực, chuẩn hóa phần trăm và xác thực URL tin tức.

## Nghiệm thu RSS với PostgreSQL

Integration test chỉ chạy khi có `TEST_DATABASE_URL`. Database này phải có hậu tố `_test` và đã được Backend bootstrap; test từ chối chạy trên database phát triển để tránh sửa nhầm dữ liệu.

```powershell
cd backend
$env:DATABASE_URL='postgresql://wikistock_test_user:wikistock_test_password@localhost:5432/wikistock_test'
npm run db:bootstrap

cd ..\crawler
$env:TEST_DATABASE_URL='postgresql://wikistock_test_user:wikistock_test_password@localhost:5432/wikistock_test'
.\.venv\Scripts\python.exe -m unittest tests.test_rss_postgres -v
```

Test nạp cùng fixture ba lần để xác nhận không tăng bài hoặc liên kết trùng, metadata được cập nhật và mỗi nguồn có một ingestion log cho mỗi lượt.

## Kiểm tra RSS thật và review thủ công

Live smoke bị tắt mặc định để CI không phụ thuộc mạng. Chỉ bật rõ ràng khi cần kiểm tra các feed đang hoạt động:

```powershell
$env:RUN_LIVE_RSS_TESTS='1'
.\.venv\Scripts\python.exe -m unittest tests.test_live_rss -v
```

Tạo phiếu CSV gồm tối đa 20 bài được matcher chấp nhận từ mỗi nguồn:

```powershell
.\.venv\Scripts\python.exe rss_review.py
```

BA điền `is_correct` bằng `true` hoặc `false` và ghi lý do tại `review_reason`, sau đó chấm gate precision 98%:

```powershell
.\.venv\Scripts\python.exe rss_review.py --score
```

Xem các bài chưa nhận diện được doanh nghiệp:

```powershell
.\.venv\Scripts\python.exe rss_review.py --unmatched
```

Không tuyên bố đạt precision 98% khi phiếu chưa được người review độc lập hoàn thành.

## Cấu trúc

- `main.py`: CLI và tổng kết lần chạy.
- `crawl_company.py`: hồ sơ, sàn giao dịch và ngành.
- `crawl_financial.py`: báo cáo và chỉ số tài chính.
- `crawl_news.py`: điều phối, đối chiếu và lưu tin RSS theo từng nguồn.
- `rss_client.py`, `rss_parser.py`: tải và chuẩn hóa RSS.
- `news_matcher.py`, `company_aliases.py`: nhận diện doanh nghiệp theo luật đã duyệt.
- `rss_review.py`: tạo và chấm phiếu review thủ công cho matcher.
- `rss_health.py`: phát hiện nguồn RSS lỗi, cũ hoặc nhiều lượt không có bài khớp.
- `scripts/run-rss-news.ps1`: entrypoint cho Windows Task Scheduler.
- `mappings.py`: quy tắc chuẩn hóa có thể test offline.
- `db.py`: kết nối, kiểm tra schema và các lệnh upsert.
- `check_requirements.py`: kiểm tra Python, thư viện và database.
