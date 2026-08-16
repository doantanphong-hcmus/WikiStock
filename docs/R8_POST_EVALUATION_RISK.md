# Rủi ro độ tin cậy AI sau R8

## Trạng thái

- **R8: Hoàn thành.** Hệ thống đã có bộ dữ liệu đánh giá, cổng kiểm tra chất lượng, kiểm thử với AI thật và báo cáo có thể tái lập.
- **Rủi ro độ tin cậy AI: Đang mở.** Chưa xử lý trong R8 theo quyết định hiện tại của nhóm.
- **Mức độ: Nghiêm trọng.** Đây là điều kiện chặn phát hành AI ra môi trường production, không chặn việc đóng R8 hoặc tiếp tục phát triển các phần độc lập.

## Tình huống được ghi nhận

Ngày 16/08/2026, bộ đánh giá RAG gồm 20 tình huống đã được chạy với Claude thông qua Zunef Client API thật. Smoke test 3 câu cơ bản đạt 3/3, nhưng bộ đánh giá đầy đủ không vượt qua cổng chất lượng.

| Chỉ số | Kết quả | Ngưỡng R8 | Đánh giá |
|---|---:|---:|---|
| Recall@5 | 81,25% | ≥ 80% | Đạt |
| Độ chính xác của trích dẫn | 50% | 100% | Không đạt |
| Độ chính xác khi từ chối câu thiếu dữ liệu | 100% | 100% | Đạt |
| Độ chính xác của trạng thái tự tin | 75% | Chưa đặt trong R8 | Cần cải thiện |
| Lỗi từ nhà cung cấp AI | 3/20 | 0 | Không đạt |
| Thời gian truy xuất p95 | 236,42 ms | ≤ 300 ms | Đạt |

Ba lỗi nhà cung cấp được quan sát gồm:

- Hai yêu cầu hết thời gian chờ.
- Một phản hồi không tuân thủ định dạng JSON bắt buộc.

Ngoài ra, AI có hiện tượng chọn quá nhiều đoạn tài liệu làm nguồn. Một số đoạn chỉ liên quan tới chủ đề nhưng không trực tiếp chứng minh nội dung trả lời, khiến độ chính xác của trích dẫn giảm mạnh.

Bằng chứng chi tiết nằm tại:

- [`../ai-service/reports/rag_evaluation_live.md`](../ai-service/reports/rag_evaluation_live.md)
- [`../ai-service/reports/rag_evaluation_live.json`](../ai-service/reports/rag_evaluation_live.json)

## Cách hiểu đúng kết quả

Kết quả này không có nghĩa toàn bộ RAG thất bại. Tầng truy xuất đã đạt ngưỡng về khả năng tìm tài liệu và tốc độ; cơ chế từ chối câu hỏi thiếu dữ liệu cũng hoạt động đúng. Rủi ro tập trung ở độ ổn định của gateway, định dạng đầu ra, trạng thái tự tin và việc lựa chọn trích dẫn của AI.

Các nguyên nhân dưới đây mới là giả thuyết, chưa được coi là kết luận:

- WikiStock chưa ánh xạ biến `API_TIMEOUT_MS` của nhà cung cấp và đang dùng thời gian chờ mặc định ngắn hơn.
- Model đôi khi thêm lời diễn giải hoặc không trả JSON theo yêu cầu.
- Prompt và quy tắc hậu kiểm chưa đủ chặt để loại bỏ trích dẫn thừa.
- Bộ truy xuất vẫn bỏ lỡ 3/16 tình huống có thể trả lời.

## Mục tiêu độ tin cậy trước production

Không sử dụng một tỷ lệ “độ tin cậy tổng” duy nhất. AI chỉ được coi là sẵn sàng khi từng tiêu chí sau đều đạt trên bộ kiểm thử đại diện có ít nhất 1.000 tình huống:

| Tiêu chí | Điều kiện phát hành |
|---|---:|
| Yêu cầu được xử lý thành công, không timeout hoặc lỗi định dạng | ≥ 99% |
| Câu trả lời đúng theo tài liệu nguồn | ≥ 99% |
| Trích dẫn trực tiếp chứng minh nội dung trả lời | ≥ 99% |
| Từ chối đúng khi không đủ dữ liệu | ≥ 99% |
| Phân loại đúng trạng thái tự tin/không tự tin | ≥ 99% |
| Số liệu tài chính bị bịa hoặc không có nguồn | 0 trường hợp |
| Khuyến nghị mua/bán trái chính sách | 0 trường hợp |

Mọi timeout, phản hồi sai định dạng, thiếu bằng chứng hoặc kết quả dưới ngưỡng phải **fail closed**: không hiển thị một câu trả lời tài chính như thể đã được xác minh.

## Phạm vi xử lý sau này

Khi nhóm quay lại xử lý rủi ro này, thực hiện theo thứ tự:

1. Đồng bộ cấu hình timeout với Client API và bổ sung retry có giới hạn.
2. Siết định dạng đầu ra và giữ nguyên nguyên tắc từ chối phản hồi không hợp lệ.
3. Chỉ cho phép trích dẫn đoạn trực tiếp hỗ trợ nội dung; câu không đủ tự tin không được tạo cảm giác đã có bằng chứng chắc chắn.
4. Cải thiện truy xuất cho các tình huống đang bỏ lỡ mà không thay đổi bộ đề để “làm đẹp” kết quả.
5. Mở rộng bộ đánh giá lên tối thiểu 1.000 tình huống, có chuyên gia nghiệp vụ kiểm tra mẫu và phân tầng theo mức độ rủi ro.
6. Chạy lại cổng chất lượng nhiều lần để đánh giá độ ổn định, không kết luận từ một lần chạy thuận lợi.

## Quyết định hiện tại

- Đóng R8 vì mục tiêu xây dựng và vận hành quy trình đánh giá đã hoàn thành.
- Chưa sửa các vấn đề trên trong thời điểm ghi nhận tài liệu này.
- Không được dùng trạng thái “R8 hoàn thành” để suy ra “AI đã sẵn sàng cho production”.
- Rủi ro này phải được xử lý và nghiệm thu lại trước khi AI cung cấp thông tin tài chính cho người dùng thật.
