# Runbook vận hành tin tức RSS

Tài liệu này dành cho người triển khai và trực vận hành pipeline tin tức. Mục tiêu là tự động cập nhật tin mỗi giờ, phát hiện sớm nguồn có vấn đề và có thể dừng hoặc chạy lại mà không xóa dữ liệu đã lưu.

## 1. Mô hình vận hành

- Máy phát triển: chạy thủ công khi cần kiểm tra.
- Staging và production: dùng **một** lịch chạy mỗi giờ.
- Không chạy lịch đồng thời trong nhiều backend replica. Crawler có khóa PostgreSQL để lượt chạy đến sau tự bỏ qua, nhưng vẫn chỉ nên khai báo một scheduler.
- Việc chạy lại an toàn vì bài viết được cập nhật theo URL và liên kết doanh nghiệp được cập nhật theo cặp bài viết - doanh nghiệp.
- N7 không cần API key hoặc secret mới.

Kiểm tra môi trường trước khi bật lịch:

```powershell
cd crawler
.\.venv\Scripts\python.exe check_requirements.py
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Chạy thử một doanh nghiệp, sau đó chạy toàn bộ danh sách:

```powershell
.\.venv\Scripts\python.exe main.py --ticker FPT --stage news
.\.venv\Scripts\python.exe main.py --stage news
.\.venv\Scripts\python.exe rss_health.py
```

## 2. Lập lịch trên Windows

Mở PowerShell tại thư mục gốc dự án và chạy một lần:

```powershell
$script = (Resolve-Path .\crawler\scripts\run-rss-news.ps1).Path
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours((Get-Date).Hour + 1) -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "WikiStock-RSS-News" -Action $action -Trigger $trigger -Description "Cập nhật tin RSS WikiStock mỗi giờ"
```

Xác nhận lịch và chạy thử:

```powershell
Get-ScheduledTask -TaskName "WikiStock-RSS-News"
Start-ScheduledTask -TaskName "WikiStock-RSS-News"
Get-ScheduledTaskInfo -TaskName "WikiStock-RSS-News"
```

Mã kết quả `0` là bình thường, `1` là có nguồn/cảnh báo dữ liệu và `2` là lỗi môi trường hoặc cơ sở dữ liệu. Log theo ngày nằm trong `runtime-logs/rss-news-YYYY-MM-DD.log` và không được commit.

## 3. Lập lịch trên Linux

Ví dụ chạy vào phút thứ 7 mỗi giờ. Thay `/srv/WikiStock` bằng đường dẫn triển khai thật:

```cron
7 * * * * cd /srv/WikiStock/crawler && .venv/bin/python main.py --stage news >> ../runtime-logs/rss-news.log 2>&1; crawler_rc=$?; .venv/bin/python rss_health.py >> ../runtime-logs/rss-news.log 2>&1; health_rc=$?; test $crawler_rc -eq 0 && exit $health_rc || exit $crawler_rc
```

Tạo `runtime-logs` trước khi bật cron và bảo đảm tài khoản chạy cron đọc được cấu hình kết nối PostgreSQL.

## 4. Cảnh báo được kiểm tra

`rss_health.py` đọc ba log gần nhất của từng nguồn đang bật và trả mã khác `0` khi gặp một trong các tình huống:

- Chưa có log hoặc log mới nhất quá 90 phút.
- Lần chạy mới nhất có trạng thái `partial`/`failed`.
- Một feed lỗi ba lần liên tiếp.
- Feed không có ngày xuất bản hợp lệ hoặc không có bài mới trong hơn 7 ngày.
- Hơn 20% mục trong feed thiếu tiêu đề hoặc URL hợp lệ.
- Không nhận diện được bài nào cho doanh nghiệp trong ba lần liên tiếp.

Scheduler hoặc hệ thống giám sát chỉ cần cảnh báo khi tác vụ trả mã khác `0`. Nếu cần đổi ngưỡng trễ:

```powershell
.\.venv\Scripts\python.exe rss_health.py --max-age-minutes 120
```

## 5. Điều tra và khôi phục

### Một nguồn bị lỗi

Xem các nguồn đang bật trong `crawler/rss_sources.json`, kiểm tra URL feed bằng trình duyệt rồi chỉ chạy lại nguồn đó:

```powershell
cd crawler
.\.venv\Scripts\python.exe main.py --stage news --news-source "VnExpress RSS"
```

Tên nguồn phải khớp trường `source_name`. Nếu URL hoặc XML của tòa soạn thay đổi, cập nhật catalog/parser và fixture tương ứng, chạy test offline, rồi mới bật lại nguồn. Để tạm dừng một feed, đặt `enabled` thành `false` và ghi rõ `disabled_reason`; không xóa nguồn hoặc dữ liệu cũ.

### Xem log gần nhất trong PostgreSQL

```sql
SELECT source.source_name,
       log.run_at,
       log.status,
       log.records_fetched,
       log.error_message
FROM data_ingestion_log AS log
JOIN data_source AS source ON source.source_id = log.source_id
WHERE source.source_name LIKE '%RSS'
ORDER BY log.run_at DESC
LIMIT 30;
```

### Xem bài chưa nhận diện được doanh nghiệp

```powershell
cd crawler
.\.venv\Scripts\python.exe rss_review.py --unmatched
```

Kết quả nằm tại `reports/rss_news_unmatched.csv`. Đây là dữ liệu điều tra để bổ sung alias/quy tắc có bằng chứng; không được tự động gán doanh nghiệp chỉ để làm giảm số bài chưa khớp.

### Không ghi được ingestion log

Lượt chạy sẽ trả mã lỗi. Kiểm tra `DATABASE_URL`, kết nối PostgreSQL, migration và quyền ghi bảng `data_ingestion_log`; sau đó chạy lại đúng một nguồn để xác nhận trước khi chạy toàn bộ.

## 6. Dừng và rollback

Dừng lịch Windows:

```powershell
Disable-ScheduledTask -TaskName "WikiStock-RSS-News"
```

Dừng lịch Linux bằng cách comment hoặc xóa đúng dòng cron của WikiStock. Nếu cần rollback mã nguồn, tắt lịch trước rồi revert commit N7. Không xóa `news_article`, `news_article_company` hoặc `data_ingestion_log`: dữ liệu đã lưu vẫn hợp lệ và lần chạy sau sẽ upsert an toàn.

## 7. Checklist bàn giao

- [ ] `check_requirements.py` thành công trên máy chạy lịch.
- [ ] Chạy thủ công `main.py --stage news` thành công.
- [ ] `rss_health.py` trả `healthy`.
- [ ] Chỉ có một scheduler được bật.
- [ ] Người trực biết vị trí log, cách chạy lại một nguồn và cách tắt feed.
- [ ] Thử tắt scheduler và bật lại mà không mất hoặc nhân đôi dữ liệu.
