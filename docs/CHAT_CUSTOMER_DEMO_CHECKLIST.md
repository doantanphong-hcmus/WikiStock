# Checklist demo chatbot WikiStock cho khách hàng

Tài liệu này là cổng nghiệm thu cuối của D5. Mục tiêu là chứng minh một người dùng mới có thể đăng ký, trò chuyện với AI bằng dữ liệu WikiStock, xem nguồn và quay lại lịch sử sau khi đăng nhập lại.

## 1. Điều kiện để được gọi là demo thật

- Frontend, Backend, AI Service và PostgreSQL đều đang chạy.
- `AI_DEMO_MODE=false` để lỗi AI không bị thay bằng câu trả lời mẫu.
- `AI_PROVIDER=gateway` và credential của gateway còn hiệu lực.
- Báo cáo FPT đã được ingest; `source_document.ingestion_status='ready'` và có `document_chunk`.
- Câu trả lời tự tin phải có nguồn đã đăng ký trong database và mở được.
- Không dùng tài khoản, lịch sử hay câu trả lời viết cứng trong mã nguồn.

Nếu thiếu một điều kiện trên, vẫn có thể kiểm thử từng phần nhưng không được giới thiệu đó là luồng AI thật hoàn chỉnh.

## 2. Hành trình bắt buộc

Thực hiện trên màn hình PC và lặp lại toàn bộ hành trình ba lần trước buổi trình bày:

1. Mở `/signup`, tạo một tài khoản mới.
2. Đăng nhập tại `/login` bằng chính tài khoản vừa tạo.
3. Mở `/ai` và tạo cuộc trò chuyện mới.
4. Hỏi: `Doanh thu quý 3 của FPT là bao nhiêu?`
5. Trong lúc chờ, xác nhận ba chấm nhảy lần lượt và nội dung trạng thái hoàn toàn bằng tiếng Việt.
6. Xác nhận câu trả lời xuất hiện dần, không hiện toàn bộ trong một lần.
7. Mở nguồn dẫn và đối chiếu đúng doanh nghiệp, tài liệu và vị trí được ghi trên giao diện.
8. Hỏi tiếp: `Còn lợi nhuận thì sao?`
9. Xác nhận hệ thống vẫn hiểu đang hỏi về FPT dù câu thứ hai không nhắc lại tên doanh nghiệp.
10. Tải lại trang, mở lại cuộc trò chuyện trong thanh bên và kiểm tra đủ bốn tin nhắn.
11. Đăng xuất, đăng nhập lại và kiểm tra lịch sử vẫn còn.

Lưu ý: streaming hiện phát câu trả lời thành nhiều đoạn sau khi AI Service đã hoàn tất việc kiểm chứng nguồn. Người dùng thấy chữ xuất hiện dần, nhưng thời gian chờ đoạn đầu chưa được rút ngắn.

## 3. Các tình huống lỗi phải thử

| Tình huống | Kết quả bắt buộc |
| --- | --- |
| Nhập sai mật khẩu | Đăng nhập bị từ chối, không tạo phiên giả |
| Đăng ký lại cùng email | Hiển thị lỗi email đã tồn tại |
| Thiếu hoặc sai API key | Hiển thị lỗi AI bằng tiếng Việt, không trả câu mẫu thành công |
| AI Service dừng | Cuộc trò chuyện còn nguyên; người dùng có thể thử lại |
| Provider hết thời gian chờ | Hiển thị lỗi thời gian chờ, không lộ chi tiết nội bộ |
| PostgreSQL dừng | Backend báo không sẵn sàng; không tuyên bố demo thành công |
| Câu hỏi không xác định được doanh nghiệp | Yêu cầu người dùng nêu rõ doanh nghiệp |
| Người dùng B mở cuộc trò chuyện của người dùng A | Trả `404`, không lộ lịch sử |

## 4. Kiểm thử tự động

### Frontend

```powershell
cd frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

### Backend

Dùng riêng một database test; không trỏ `TEST_DATABASE_URL` vào database dev hoặc demo.

```powershell
cd backend
$env:TEST_DATABASE_URL = 'postgresql://app_user:app_password@localhost:55432/wikistock_e2e'
npm.cmd run lint:check
npm.cmd run format:check
npm.cmd run build
npm.cmd test -- --runInBand
npm.cmd run test:e2e -- --runInBand
Remove-Item Env:TEST_DATABASE_URL
```

`test/chat-demo.e2e-spec.ts` bao phủ một hành trình liền mạch: đăng ký, lỗi đăng ký trùng, lỗi mật khẩu, đăng nhập, streaming hai câu hỏi liên tiếp, giữ ngữ cảnh FPT, tải lại lịch sử, đăng nhập lại và cách ly dữ liệu giữa hai người dùng.

### AI Service offline

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
..\.venv\Scripts\python.exe -m compileall -q app main.py
```

### AI Service với provider thật

Nạp credential bằng biến môi trường local, không ghi key vào lệnh, tài liệu hoặc Git.

```powershell
cd ai-service
$env:RUN_LIVE_AI_TESTS = '1'
$env:AI_PROVIDER = 'gateway'
..\.venv\Scripts\python.exe -m unittest tests.test_live_ai -v
Remove-Item Env:RUN_LIVE_AI_TESTS, Env:AI_PROVIDER -ErrorAction SilentlyContinue
```

Ba câu live phải cùng đạt. HTTP `401` nghĩa là gateway không chấp nhận credential; không phải kết quả đạt và không nên sửa bằng cách bật chế độ demo.

## 5. Kết quả trên nhánh D5 ngày 20/08/2026

| Hạng mục | Kết quả | Ghi chú |
| --- | --- | --- |
| Frontend test, lint, build | Đạt | Trạng thái chờ tiếng Việt và animation ba chấm đã qua quality gate |
| Hành trình Backend + PostgreSQL | Đạt | Test D5 chạy với PostgreSQL test thật |
| Giữ ngữ cảnh FPT | Đạt | Câu hỏi tiếp theo vẫn gửi `companyCode=FPT` |
| Lưu lịch sử và cách ly người dùng | Đạt | Đăng nhập lại thấy lịch sử; người dùng khác bị chặn |
| Provider AI thật | Đạt | Ba câu grounded và ba kiểm tra streaming live đều đạt với `x-api-key`; chữ đầu xuất hiện sau khoảng 2,3 giây trong lần đo này |
| Ingest PDF local | Chưa xác nhận lại | Lần nạp model BGE-M3 trên máy này treo; cần xử lý cache/model trước khi demo |
| Kiểm tra thẩm mỹ trực tiếp | Chưa xác nhận | Công cụ Browser của phiên làm việc lỗi cấu hình trusted path; cần QA mở giao diện PC kiểm tra thủ công |
| Happy path lặp ba lần | Chưa thực hiện | Chỉ chạy sau khi provider và dữ liệu RAG đã sẵn sàng |

Kết luận hiện tại: phần code, hợp đồng D5 và kết nối provider thật đã vượt qua kiểm thử tự động. Chưa bàn giao khách hàng cho tới khi dữ liệu RAG local được nạp thành công, giao diện được kiểm tra trực tiếp và hành trình thủ công chạy xanh ba lần.

## 6. Kiểm tra an toàn trước khi commit

```powershell
git status --short
git diff --check
git grep -n -E 'zf_|sk-ant-|AI_API_KEY=.+|ANTHROPIC_AUTH_TOKEN=.+'
```

Lệnh cuối không được trả về credential thật. `.env`, output OCR và cache mô hình không được đưa vào commit.
