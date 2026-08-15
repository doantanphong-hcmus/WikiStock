from __future__ import annotations

from typing import Any

import httpx

from app.config import AiSettings
from app.models import AiGenerationError


class AiGatewayClient:
    """One concrete Anthropic Messages-compatible gateway client."""

    def __init__(
        self,
        settings: AiSettings,
        *,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        if not settings.api_key.strip():
            raise AiGenerationError("AI_API_KEY_REQUIRED", "AI API key is required")
        self.settings = settings
        self.transport = transport

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        timeout = httpx.Timeout(
            connect=self.settings.connect_timeout_seconds,
            read=self.settings.read_timeout_seconds,
            write=self.settings.read_timeout_seconds,
            pool=self.settings.connect_timeout_seconds,
        )
        try:
            with httpx.Client(timeout=timeout, transport=self.transport) as client:
                response = client.post(
                    f"{self.settings.base_url.rstrip('/')}/messages",
                    headers={
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                        "x-api-key": self.settings.api_key,
                    },
                    json={
                        "model": self.settings.model,
                        "max_tokens": 1200,
                        "temperature": 0,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_prompt}],
                    },
                )
        except httpx.ConnectTimeout as error:
            raise AiGenerationError(
                "AI_CONNECT_TIMEOUT", "AI gateway connection timed out"
            ) from error
        except httpx.ReadTimeout as error:
            raise AiGenerationError(
                "AI_READ_TIMEOUT", "AI gateway response timed out"
            ) from error
        except httpx.HTTPError as error:
            raise AiGenerationError(
                "AI_PROVIDER_UNAVAILABLE", "AI gateway request failed"
            ) from error

        self._raise_for_status(response.status_code)
        try:
            body: Any = response.json()
            content = body["content"]
            text = next(
                block["text"]
                for block in content
                if block.get("type") == "text" and isinstance(block.get("text"), str)
            )
        except (ValueError, KeyError, TypeError, StopIteration) as error:
            raise AiGenerationError(
                "AI_INVALID_RESPONSE", "AI gateway returned an invalid response"
            ) from error
        if not text.strip():
            raise AiGenerationError(
                "AI_INVALID_RESPONSE", "AI gateway returned an empty response"
            )
        return text

    @staticmethod
    def _raise_for_status(status_code: int) -> None:
        if 200 <= status_code < 300:
            return
        if status_code == 401:
            code = "AI_AUTHENTICATION_FAILED"
        elif status_code == 429:
            code = "AI_RATE_LIMITED"
        elif status_code >= 500:
            code = "AI_PROVIDER_UNAVAILABLE"
        else:
            code = "AI_PROVIDER_ERROR"
        raise AiGenerationError(code, f"AI gateway returned HTTP {status_code}")
