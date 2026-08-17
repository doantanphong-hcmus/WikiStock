# Hợp đồng nguồn tin RSS của WikiStock

**Phiên bản:** 1  
**Ngày xác minh kỹ thuật:** 17/08/2026  
**Phạm vi:** N0 – chốt nguồn, cách sử dụng và dữ liệu mẫu; chưa chạy crawler RSS thật.

## 1. Quyết định của N0

- Dùng 10 feed chính thức từ VnExpress, Thanh Niên, Tuổi Trẻ, CafeBiz và VnEconomy.
- Bật 9 feed có bài mới trong vòng 7 ngày tại thời điểm xác minh.
- Tắt feed Tuổi Trẻ vì bài mới nhất vẫn là ngày 30/06/2026.
- Chỉ lưu tên nguồn, tiêu đề, tóm tắt RSS, ngày đăng và URL bài gốc.
- Không tải toàn văn, hình ảnh, nội dung trả phí hoặc trang lưu trữ của tòa soạn.
- Không dùng AI để quyết định bài thuộc doanh nghiệp nào.

Danh mục máy đọc được nằm tại [`crawler/rss_sources.json`](../crawler/rss_sources.json).

## 2. Danh mục feed đã xác minh

Tất cả URL dưới đây trả HTTP `200`, là XML parse được và có URL bài tuyệt đối trong lần kiểm tra ngày 17/08/2026.

| Tòa soạn | Chuyên mục | Trạng thái | Bài mới nhất | URL |
|---|---|---|---|---|
| VnExpress | Kinh doanh | Bật | 17/08/2026 | `https://vnexpress.net/rss/kinh-doanh.rss` |
| Thanh Niên | Chứng khoán | Bật | 17/08/2026 | `https://thanhnien.vn/rss/kinh-te/chung-khoan.rss` |
| Thanh Niên | Doanh nghiệp | Bật | 17/08/2026 | `https://thanhnien.vn/rss/kinh-te/doanh-nghiep.rss` |
| Tuổi Trẻ | Tài chính - Chứng khoán | **Tắt** | 30/06/2026 | `https://tuoitre.vn/nld/rss/nld/kinh-te/tai-chinh-chung-khoan.rss` |
| CafeBiz | Kinh doanh | Bật | 17/08/2026 | `https://cafebiz.vn/rss/cau-chuyen-kinh-doanh.rss` |
| CafeBiz | Chứng khoán | Bật | 13/08/2026 | `https://cafebiz.vn/rss/chung-khoan.rss` |
| CafeBiz | Ngân hàng - Tài chính | Bật | 13/08/2026 | `https://cafebiz.vn/rss/ngan-hang-tai-chinh.rss` |
| VnEconomy | Chứng khoán | Bật | 17/08/2026 | `https://vneconomy.vn/chung-khoan.rss` |
| VnEconomy | Doanh nghiệp | Bật | 17/08/2026 | `https://vneconomy.vn/nhip-cau-doanh-nghiep.rss` |
| VnEconomy | Tài chính | Bật | 17/08/2026 | `https://vneconomy.vn/tai-chinh.rss` |

Trạng thái `Bật` chỉ xác nhận feed đủ điều kiện kỹ thuật để phát triển. Nó không thay thế bước duyệt điều khoản trước khi công khai sản phẩm.

## 3. Hostname được phép

| Tòa soạn | Hostname bài viết được chấp nhận |
|---|---|
| VnExpress | `vnexpress.net` |
| Thanh Niên | `thanhnien.vn` |
| Tuổi Trẻ | `tuoitre.vn` |
| CafeBiz | `cafebiz.vn` |
| VnEconomy | `vneconomy.vn` |

Parser phải từ chối URL có scheme khác `http/https`, URL tương đối hoặc hostname ngoài danh sách. Không tự đoán URL canonical và không tự thêm hostname mới.

## 4. Checklist sử dụng và ghi nguồn

**Người chịu trách nhiệm duyệt trước khi phát hành công khai:** Product Owner WikiStock.

| Nguồn | Điều kiện ghi nhận được | Cách WikiStock tuân thủ | Trạng thái duyệt công khai |
|---|---|---|---|
| VnExpress | RSS miễn phí cho cá nhân/tổ chức phi lợi nhuận; phải nêu rõ thông tin nguồn; tòa soạn có quyền yêu cầu ngừng phân phối | Hiển thị `VnExpress`, chỉ giữ metadata và dẫn về bài gốc | Chờ Product Owner xác nhận dự án phù hợp phạm vi phi lợi nhuận |
| Thanh Niên | Trang RSS mô tả việc đọc tiêu đề, tóm tắt và mở bài gốc; chưa thấy quyền đăng lại toàn văn trên trang này | Chỉ giữ metadata, hiển thị `Thanh Niên`, không đăng lại toàn văn | Chờ Product Owner duyệt điều khoản chung |
| Tuổi Trẻ | RSS miễn phí cho cá nhân/tổ chức phi lợi nhuận; phải nêu rõ thông tin nguồn; có quyền yêu cầu ngừng phân phối | Hiển thị `Tuổi Trẻ`, chỉ giữ metadata và dẫn về bài gốc | Chờ duyệt; feed đang tắt vì cũ |
| CafeBiz | Khi sử dụng lại tin phải ghi `Theo CafeBiz.vn` hoặc `CafeBiz.vn` | Hiển thị `CafeBiz.vn` cạnh tiêu đề và link bài gốc | Chờ Product Owner duyệt điều khoản chung |
| VnEconomy | RSS miễn phí cho cá nhân/tổ chức phi lợi nhuận; yêu cầu cung cấp rõ thông tin nguồn; có quyền yêu cầu ngừng phân phối | Hiển thị `VnEconomy`, chỉ giữ metadata và dẫn về bài gốc | Chờ Product Owner xác nhận dự án phù hợp phạm vi phi lợi nhuận |

Nguồn tham chiếu chính thức:

- VnExpress: `https://e.vnexpress.net/rss`
- Thanh Niên: `https://thanhnien.vn/rss.html`
- Tuổi Trẻ: `https://tuoitre.vn/rss.htm`
- CafeBiz: `https://cafebiz.vn/index.rss`
- VnEconomy: `https://vneconomy.vn/rss.html`

Đây là checklist kỹ thuật, không phải ý kiến tư vấn pháp lý. Nếu WikiStock chuyển sang mục đích thương mại, phải xin phép hoặc đánh giá lại quyền sử dụng trước khi tiếp tục phân phối metadata RSS.

## 5. Quy tắc dữ liệu đầu vào

- `source_name` lấy từ cấu hình, không tin tên tùy ý trong XML.
- `title` bắt buộc có nội dung sau khi bỏ HTML và giải mã entity.
- `summary` chỉ giữ văn bản ngắn; thiếu thì để `null`.
- `url` phải tuyệt đối và thuộc hostname của nguồn.
- `published_at` dùng ngày RSS; không lấy ngày crawl thay ngày xuất bản.
- Mỗi URL bài gốc chỉ tạo một `news_article`.
- Một bài có thể liên kết nhiều doanh nghiệp khi có đủ bằng chứng theo luật matcher.
- Bài không chắc chắn phải bị bỏ qua, không cố tăng số lượng.

## 6. Fixture và dữ liệu matcher

- Mỗi tòa soạn có một fixture XML tối giản tại `crawler/tests/fixtures/rss/`.
- Fixture giữ một tiêu đề, URL và `pubDate` thật; đã bỏ ảnh và nội dung dư thừa.
- `crawler/tests/fixtures/rss_match_cases.json` chứa 42 ca đúng/sai cho 10 mã cổ phiếu demo.
- Dữ liệu matcher là ca hồi quy do team biên soạn, không phải nội dung bài báo được sao chép.

## 7. Điều kiện bật lại Tuổi Trẻ

Chỉ đổi feed Tuổi Trẻ sang `enabled: true` khi đồng thời đạt đủ:

1. Feed chính thức trả HTTP `200` và XML hợp lệ.
2. Có ít nhất một bài được xuất bản trong 7 ngày gần nhất.
3. URL bài thuộc `tuoitre.vn`.
4. Fixture và kiểm thử contract vẫn chạy xanh.
5. Product Owner đã duyệt điều khoản sử dụng.

Không tự động bật lại chỉ vì endpoint còn phản hồi `200`.

## 8. Gate hoàn thành N0

- [x] URL feed lấy từ trang RSS chính thức, không suy đoán.
- [x] Hostname, chuyên mục và trạng thái được lưu trong version control.
- [x] Mỗi tòa soạn có fixture chứa `title`, `link` và `pubDate` thật.
- [x] Có 42 ca nền cho matcher.
- [x] Tuổi Trẻ được tắt với lý do và điều kiện bật lại rõ ràng.
- [x] Product Owner WikiStock được giao trách nhiệm duyệt điều khoản.
- [ ] Product Owner ký xác nhận quyền sử dụng trước khi triển khai công khai.
