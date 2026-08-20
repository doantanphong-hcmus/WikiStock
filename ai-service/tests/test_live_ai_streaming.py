from __future__ import annotations

import json
import os
import time
import unittest

import httpx

from app.config import AiSettings


LIVE_STREAM_ENABLED = (
    os.getenv("RUN_LIVE_AI_STREAM_TESTS") == "1"
    and bool(os.getenv("AI_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN"))
)


def _headers(settings: AiSettings, api_key: str | None = None) -> dict[str, str]:
    headers = dict(settings.custom_headers)
    headers.update(
        {
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
    )
    credential = settings.api_key if api_key is None else api_key
    if settings.auth_scheme == "bearer":
        headers["authorization"] = f"Bearer {credential}"
    else:
        headers["x-api-key"] = credential
    return headers


def _payload(settings: AiSettings, prompt: str, max_tokens: int = 32) -> dict:
    return {
        "model": settings.model,
        "max_tokens": max_tokens,
        "temperature": 0,
        "stream": True,
        "messages": [{"role": "user", "content": prompt}],
    }


@unittest.skipUnless(
    LIVE_STREAM_ENABLED,
    "set RUN_LIVE_AI_STREAM_TESTS=1 and an AI gateway credential",
)
class LiveAiStreamingContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.settings = AiSettings.from_env()
        cls.url = f"{cls.settings.base_url.rstrip('/')}/messages"
        cls.timeout = httpx.Timeout(
            connect=cls.settings.connect_timeout_seconds,
            read=cls.settings.read_timeout_seconds,
            write=cls.settings.read_timeout_seconds,
            pool=cls.settings.connect_timeout_seconds,
        )

    def test_gateway_emits_anthropic_sse_events(self) -> None:
        event_types: list[str] = []
        text_deltas: list[str] = []
        started_at = time.perf_counter()
        first_text_at: float | None = None

        with httpx.Client(timeout=self.timeout) as client:
            with client.stream(
                "POST",
                self.url,
                headers=_headers(self.settings),
                json=_payload(self.settings, "Reply with exactly: pong"),
            ) as response:
                self.assertEqual(response.status_code, 200)
                self.assertIn(
                    "text/event-stream",
                    response.headers.get("content-type", ""),
                )

                current_event = ""
                for line in response.iter_lines():
                    if line.startswith("event:"):
                        current_event = line.removeprefix("event:").strip()
                    elif line.startswith("data:"):
                        raw_data = line.removeprefix("data:").strip()
                        if raw_data == "[DONE]":
                            event_types.append("done")
                            continue
                        payload = json.loads(raw_data)
                        payload_type = payload.get("type", current_event)
                        if payload_type:
                            event_types.append(payload_type)
                        delta = payload.get("delta", {})
                        if delta.get("type") == "text_delta" and delta.get("text"):
                            if first_text_at is None:
                                first_text_at = time.perf_counter()
                            text_deltas.append(delta["text"])

        required = {
            "message_start",
            "content_block_start",
            "content_block_delta",
            "content_block_stop",
            "message_delta",
        }
        self.assertTrue(required.issubset(event_types), event_types)
        self.assertTrue(
            {"message_stop", "done"}.intersection(event_types), event_types
        )
        self.assertTrue("".join(text_deltas).strip())
        self.assertIsNotNone(first_text_at)

        first_text_ms = round((first_text_at - started_at) * 1000)
        total_ms = round((time.perf_counter() - started_at) * 1000)
        print(
            "stream_contract",
            {
                "event_types": list(dict.fromkeys(event_types)),
                "text_delta_count": len(text_deltas),
                "first_text_ms": first_text_ms,
                "total_ms": total_ms,
            },
        )

    def test_stream_request_rejects_invalid_key(self) -> None:
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                self.url,
                headers=_headers(self.settings, "invalid-stream-test-key"),
                json=_payload(self.settings, "Reply with pong"),
            )
        self.assertEqual(response.status_code, 401)

    def test_client_can_close_stream_after_first_text_delta(self) -> None:
        saw_text_delta = False
        with httpx.Client(timeout=self.timeout) as client:
            with client.stream(
                "POST",
                self.url,
                headers=_headers(self.settings),
                json=_payload(
                    self.settings,
                    "Count from 1 to 100, one number per line.",
                    max_tokens=200,
                ),
            ) as response:
                self.assertEqual(response.status_code, 200)
                for line in response.iter_lines():
                    if not line.startswith("data:"):
                        continue
                    payload = json.loads(line.removeprefix("data:").strip())
                    if payload.get("delta", {}).get("type") == "text_delta":
                        saw_text_delta = True
                        break
        self.assertTrue(saw_text_delta)


if __name__ == "__main__":
    unittest.main()
