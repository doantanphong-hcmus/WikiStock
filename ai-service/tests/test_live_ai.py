from __future__ import annotations

import os
import unittest

from app.ai_client import AiGatewayClient
from app.config import AiSettings
from app.models import RetrievalResult, RetrievedChunk
from app.rag_pipeline import generate_grounded_answer


@unittest.skipUnless(
    os.getenv("RUN_LIVE_AI_TESTS") == "1" and os.getenv("AI_API_KEY"),
    "set RUN_LIVE_AI_TESTS=1 and AI_API_KEY to run live gateway smoke tests",
)
class LiveAiSmokeTests(unittest.TestCase):
    def test_three_grounded_questions(self) -> None:
        source = RetrievedChunk(
            chunk_id=123,
            document_id=8,
            title="Synthetic smoke-test source",
            page_number=1,
            location_ref="Page 1",
            content=(
                "Synthetic test facts: Revenue was 100 in 2024 and 120 in 2025. "
                "Profit after tax was 10 in 2025. No debt data is provided."
            ),
            similarity=0.99,
            company_code="FPT",
            fiscal_year=2025,
            document_type="annual_report",
        )
        retrieval = RetrievalResult(True, (source,), 1.0)
        settings = AiSettings.from_env()
        client = AiGatewayClient(settings)

        for question in (
            "Doanh thu năm 2025 là bao nhiêu?",
            "Lợi nhuận sau thuế năm 2025 là bao nhiêu?",
            "Nợ phải trả năm 2025 là bao nhiêu?",
        ):
            with self.subTest(question=question):
                answer = generate_grounded_answer(
                    question,
                    "FPT",
                    retriever=lambda *args, **kwargs: retrieval,
                    client=client,
                )
                self.assertTrue(answer.answer.strip())
                self.assertTrue(
                    all(item.chunk_id == 123 for item in answer.evidence)
                )


if __name__ == "__main__":
    unittest.main()
