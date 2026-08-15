from __future__ import annotations

import json
import unittest
from pathlib import Path

import httpx

from app.ai_client import AiGatewayClient
from app.config import AiSettings
from app.models import AiGenerationError


FIXTURES = Path(__file__).parent / "fixtures"


class AiGatewayClientTests(unittest.TestCase):
    def client(self, handler) -> AiGatewayClient:
        return AiGatewayClient(
            AiSettings(provider="claude_proxy", api_key="test-key"),
            transport=httpx.MockTransport(handler),
        )

    def test_reads_text_block_from_success_fixture(self) -> None:
        body = json.loads((FIXTURES / "claude_success.json").read_text("utf-8"))

        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(request.headers["x-api-key"], "test-key")
            self.assertEqual(request.headers["anthropic-version"], "2023-06-01")
            payload = json.loads(request.content)
            self.assertEqual(payload["system"], "system")
            return httpx.Response(200, json=body)

        self.assertEqual(self.client(handler).generate("system", "question"), "pong")

    def test_maps_provider_status_codes_without_exposing_response(self) -> None:
        expected = {
            401: "AI_AUTHENTICATION_FAILED",
            429: "AI_RATE_LIMITED",
            500: "AI_PROVIDER_UNAVAILABLE",
        }
        for status, code in expected.items():
            with self.subTest(status=status):
                client = self.client(
                    lambda request, status=status: httpx.Response(
                        status, json={"secret": "must-not-escape"}
                    )
                )
                with self.assertRaises(AiGenerationError) as caught:
                    client.generate("system", "question")
                self.assertEqual(caught.exception.code, code)
                self.assertNotIn("must-not-escape", str(caught.exception))

    def test_maps_connect_and_read_timeouts(self) -> None:
        for error, code in (
            (httpx.ConnectTimeout("slow connect"), "AI_CONNECT_TIMEOUT"),
            (httpx.ReadTimeout("slow read"), "AI_READ_TIMEOUT"),
        ):
            with self.subTest(code=code):
                client = self.client(lambda request, error=error: (_ for _ in ()).throw(error))
                with self.assertRaises(AiGenerationError) as caught:
                    client.generate("system", "question")
                self.assertEqual(caught.exception.code, code)

    def test_rejects_malformed_provider_response(self) -> None:
        client = self.client(lambda request: httpx.Response(200, json={"content": []}))
        with self.assertRaises(AiGenerationError) as caught:
            client.generate("system", "question")
        self.assertEqual(caught.exception.code, "AI_INVALID_RESPONSE")

    def test_requires_api_key(self) -> None:
        with self.assertRaises(AiGenerationError) as caught:
            AiGatewayClient(AiSettings(provider="claude_proxy"))
        self.assertEqual(caught.exception.code, "AI_API_KEY_REQUIRED")


if __name__ == "__main__":
    unittest.main()
