# Hợp đồng streaming của AI gateway

**Chặng:** D0 — `spike/ai-streaming-contract`

**Ngày xác minh:** 20/08/2026

**Phạm vi:** Gateway → AI Service; chưa triển khai stream công khai qua Backend/Frontend

## Kết luận

Gateway hiện tại **có hỗ trợ streaming thật** tại:

```text
POST https://claude.zunef.com/v1/ai/messages
```

Request dùng Anthropic Messages-compatible payload với `stream: true`. Credential hiện tại hoạt động với:

```text
Authorization: Bearer <AI_API_KEY>
```

Trong lần xác minh này, cùng credential gửi bằng `x-api-key` nhận HTTP 401. Vì vậy môi trường demo phải đặt rõ:

```dotenv
AI_PROVIDER=gateway
AI_API_BASE_URL=https://claude.zunef.com/v1/ai
AI_AUTH_SCHEME=bearer
AI_MODEL=claude-sonnet-4-6
```

Không dựa vào giá trị mặc định của auth scheme và không commit `AI_API_KEY`.

## Event quan sát được

Một request live ngắn nhận HTTP 200, `Content-Type: text/event-stream` và chuỗi event:

```text
ping
message_start
content_block_start
content_block_delta
content_block_stop
message_delta
message_stop
data: [DONE]
```

Gateway vừa gửi `message_stop` theo Anthropic SSE, vừa gửi thêm sentinel `[DONE]`. Parser D3 phải chấp nhận cả hai và không cố parse `[DONE]` thành JSON.

Text được truyền trong:

```json
{
  "type": "content_block_delta",
  "delta": {
    "type": "text_delta",
    "text": "..."
  }
}
```

Gateway/model có thể phát block khác như thinking. D3 chỉ được chuyển `text_delta` cần hiển thị; không đưa thinking, raw JSON nội bộ hoặc metadata provider ra Frontend.

## Kết quả live probe

| Kiểm tra | Kết quả |
|---|---|
| Bearer credential + `stream: true` | HTTP 200, SSE hợp lệ |
| Credential hiện tại qua `x-api-key` | HTTP 401 |
| Credential sai qua Bearer | HTTP 401 |
| Client đóng sau text delta đầu | Đóng stream phía client thành công |
| Event kết thúc | Có cả `message_stop` và `[DONE]` |

Lần đo với prompt cực ngắn ghi nhận text delta đầu khoảng 6,5 giây và toàn request khoảng 6,6 giây. Đây chỉ là smoke test một lần, **không phải benchmark hoặc SLA**.

Việc client đóng kết nối thành công không chứng minh upstream provider chắc chắn đã dừng tính token. D3 chỉ có thể hủy request phía WikiStock; muốn xác nhận billing/cancellation phía upstream phải có số liệu từ nhà cung cấp.

## Cách chạy lại

Nạp credential bằng secret store hoặc `.env` local, sau đó chạy:

```powershell
$env:RUN_LIVE_AI_STREAM_TESTS = '1'
..\.venv\Scripts\python.exe -m unittest tests.test_live_ai_streaming -v
Remove-Item Env:RUN_LIVE_AI_STREAM_TESTS
```

Test tự bỏ qua nếu thiếu cờ live hoặc credential. Output chỉ chứa loại event, số delta và timing; không in nội dung trả lời hoặc API key.

## Quyết định cho D3

Gateway đủ khả năng triển khai native streaming. Tuy nhiên RAG hiện yêu cầu model trả một JSON hoàn chỉnh để kiểm tra `answer`, `isConfident` và `usedChunkIds`. Không được đẩy raw JSON hoặc câu trả lời chưa kiểm chứng thẳng ra giao diện.

D3 phải chọn một trong hai đường:

1. **An toàn và nhanh cho demo:** chờ AI Service parse/validate JSON và Backend kiểm chứng citation, sau đó phát phần `answer` thành nhiều delta cho Frontend. Người dùng thấy chữ xuất hiện dần nhưng thời gian chờ token đầu chưa giảm.
2. **Native first-token streaming:** thiết kế lại response contract để nội dung có thể phát dần mà vẫn không công khai câu trả lời trước khi evidence hợp lệ. Chỉ chọn khi có đủ thời gian kiểm thử parser và failure path.

Với mục tiêu demo gấp, chọn phương án 1 trước. Không hy sinh citation validation chỉ để giảm vài giây chờ ban đầu.

## Giới hạn D0

- Chưa triển khai method stream trong `AiGatewayClient`.
- Chưa có endpoint SSE từ AI Service hoặc Backend.
- Chưa nối Frontend.
- Không chủ động tạo timeout live vì kết quả phụ thuộc mạng và không ổn định; timeout mapping hiện có tiếp tục được kiểm tra offline.
- Không lưu response body live làm fixture để tránh lưu nội dung không cần thiết.
