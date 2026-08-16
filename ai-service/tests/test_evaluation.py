from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from app.config import RetrievalSettings
from app.evaluation import GoldenCase, evaluate, load_cases, write_reports
from app.models import AiGenerationError, RetrievalResult, RetrievedChunk


def _chunk(chunk_id: int, page: int, content: str) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id,
        1,
        "FPT Quy 1 2026",
        page,
        f"Trang {page}",
        content,
        0.9,
        "FPT",
        2026,
        "financial_statement",
    )


class EvaluationTests(unittest.TestCase):
    def test_fixture_has_required_twenty_case_distribution(self) -> None:
        cases = load_cases(Path(__file__).parent / "fixtures/rag_evaluation.json")
        counts = {}
        for case in cases:
            counts[case.category] = counts.get(case.category, 0) + 1
        self.assertEqual(
            counts,
            {
                "exact_fact": 6,
                "quarter_comparison": 4,
                "narrative": 4,
                "wrong_filter": 2,
                "unsupported": 2,
                "prompt_injection": 2,
            },
        )

    def test_scores_recall_and_writes_json_and_markdown(self) -> None:
        cases = [
            GoldenCase(
                "hit",
                "exact_fact",
                "revenue",
                "FPT",
                2026,
                (),
                "FPT.*2026",
                (3,),
                ("revenue",),
                True,
            ),
            GoldenCase(
                "miss",
                "exact_fact",
                "profit",
                "FPT",
                2026,
                (),
                "FPT.*2026",
                (9,),
                ("profit",),
                True,
            ),
        ]

        def retriever(query, *args, **kwargs):
            content = "revenue evidence" if query == "revenue" else "other"
            return RetrievalResult(True, (_chunk(1, 3, content),), 12.5)

        report = evaluate(
            cases,
            RetrievalSettings(database_url="unused"),
            retriever=retriever,
        )
        self.assertEqual(report["metrics"]["recallAt5"], 0.5)
        self.assertFalse(report["passed"])

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "report"
            write_reports(report, output)
            self.assertEqual(
                json.loads(output.with_suffix(".json").read_text("utf-8"))[
                    "fixtureCount"
                ],
                2,
            )
            self.assertIn(
                "# RAG evaluation report",
                output.with_suffix(".md").read_text("utf-8"),
            )

    def test_fake_provider_cites_only_ground_truth_and_abstains(self) -> None:
        answerable = GoldenCase(
            "hit",
            "exact_fact",
            "revenue",
            "FPT",
            2026,
            (),
            "FPT.*2026",
            (3,),
            ("revenue",),
            True,
        )
        unsupported = GoldenCase(
            "unsupported",
            "unsupported",
            "live price",
            "FPT",
            None,
            (),
            None,
            (),
            (),
            False,
        )

        def retriever(query, *args, **kwargs):
            return RetrievalResult(
                True, (_chunk(1, 3, "revenue evidence"),), 1.0
            )

        report = evaluate(
            [answerable, unsupported],
            RetrievalSettings(database_url="unused"),
            fake_provider=True,
            retriever=retriever,
        )

        self.assertEqual(report["mode"], "fake_provider")
        self.assertEqual(report["metrics"]["citationPrecision"], 1.0)
        self.assertEqual(report["metrics"]["abstentionAccuracy"], 1.0)
        self.assertTrue(report["passed"])

    def test_provider_error_is_reported_without_aborting_evaluation(self) -> None:
        case = GoldenCase(
            "provider-error",
            "exact_fact",
            "revenue",
            "FPT",
            2026,
            (),
            "FPT.*2026",
            (3,),
            ("revenue",),
            True,
        )

        class FailingClient:
            @staticmethod
            def generate(system_prompt: str, user_prompt: str) -> str:
                del system_prompt, user_prompt
                raise AiGenerationError("AI_INVALID_RESPONSE", "invalid")

        report = evaluate(
            [case],
            RetrievalSettings(database_url="unused"),
            live_provider=True,
            retriever=lambda *args, **kwargs: RetrievalResult(
                True, (_chunk(1, 3, "revenue evidence"),), 1.0
            ),
            client=FailingClient(),  # type: ignore[arg-type]
        )

        self.assertEqual(report["metrics"]["providerErrors"], 1)
        self.assertEqual(
            report["cases"][0]["providerError"], "AI_INVALID_RESPONSE"
        )
        self.assertFalse(report["passed"])


if __name__ == "__main__":
    unittest.main()
