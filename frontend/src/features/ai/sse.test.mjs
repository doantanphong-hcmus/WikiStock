import assert from "node:assert/strict";
import test from "node:test";
import { extractSseEvents } from "./sse.ts";

test("giữ event SSE chưa đủ và đọc đúng event khi gói mạng bị chia nhỏ", () => {
  let buffer = 'event: delta\ndata: {"text":"Xin';
  let result = extractSseEvents(buffer);
  assert.equal(result.events.length, 0);

  buffer = result.remainder + ' chào"}\n\nevent: completed\ndata: {"ok":true}\n\n';
  result = extractSseEvents(buffer);

  assert.deepEqual(result.events, [
    { event: "delta", data: { text: "Xin chào" } },
    { event: "completed", data: { ok: true } },
  ]);
  assert.equal(result.remainder, "");
});

test("bỏ qua heartbeat và đọc event cuối khi server đóng kết nối", () => {
  const result = extractSseEvents(
    ': ping\n\nevent: error\ndata: {"code":"TIMEOUT"}',
    true,
  );

  assert.deepEqual(result.events, [
    { event: "error", data: { code: "TIMEOUT" } },
  ]);
});
