from __future__ import annotations

import argparse
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Sequence

from app.ai_client import AiGatewayClient
from app.config import AiSettings, RetrievalSettings
from app.models import GeneratedAnswer, RetrievalResult, RetrievedChunk
from app.rag_pipeline import generate_grounded_answer
from app.retrieval import retrieve_evidence


@dataclass(frozen=True)
class GoldenCase:
    id: str
    category: str
    question: str
    company_code: str
    fiscal_year: int | None
    document_types: tuple[str, ...]
    expected_document_pattern: str | None
    expected_pages: tuple[int, ...]
    expected_keywords: tuple[str, ...]
    should_be_confident: bool


def load_cases(path: Path) -> list[GoldenCase]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    cases = [
        GoldenCase(
            id=item["id"],
            category=item["category"],
            question=item["question"],
            company_code=item["companyCode"],
            fiscal_year=item["filters"].get("year"),
            document_types=tuple(item["filters"].get("documentTypes", [])),
            expected_document_pattern=item.get("expectedDocumentPattern"),
            expected_pages=tuple(item.get("expectedPages", [])),
            expected_keywords=tuple(item.get("expectedKeywords", [])),
            should_be_confident=item["shouldBeConfident"],
        )
        for item in payload
    ]
    if len(cases) < 20 or len({case.id for case in cases}) != len(cases):
        raise ValueError("evaluation fixture requires at least 20 unique cases")
    return cases


def _supports(case: GoldenCase, chunk: RetrievedChunk) -> bool:
    if not case.expected_document_pattern or not case.expected_pages:
        return False
    if not re.search(case.expected_document_pattern, chunk.title, re.IGNORECASE):
        return False
    if chunk.page_number not in case.expected_pages:
        return False
    content = chunk.content.casefold()
    return not case.expected_keywords or any(
        keyword.casefold() in content for keyword in case.expected_keywords
    )


def _p95(values: Sequence[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    return ordered[max(0, math.ceil(len(ordered) * 0.95) - 1)]


def evaluate(
    cases: Sequence[GoldenCase],
    settings: RetrievalSettings,
    *,
    live_provider: bool = False,
    fake_provider: bool = False,
    retriever: Callable[..., RetrievalResult] = retrieve_evidence,
    client: AiGatewayClient | None = None,
) -> dict[str, object]:
    if live_provider and fake_provider:
        raise ValueError("choose only one provider mode")
    use_provider = live_provider or fake_provider
    rows: list[dict[str, object]] = []
    answerable = [case for case in cases if case.should_be_confident]
    unsupported = [case for case in cases if not case.should_be_confident]
    recall_hits = 0
    supporting_citations = 0
    total_citations = 0
    correct_abstentions = 0
    confidence_matches = 0

    for case in cases:
        retrieval = retriever(
            case.question,
            case.company_code,
            case.fiscal_year,
            case.document_types,
            settings=settings,
        )
        chunks_by_id = {chunk.chunk_id: chunk for chunk in retrieval.evidence}
        recall_hit = any(_supports(case, chunk) for chunk in retrieval.evidence)
        recall_hits += int(case.should_be_confident and recall_hit)
        generated: GeneratedAnswer | None = None
        cited_chunks: list[RetrievedChunk] = []

        if use_provider:
            case_client = client
            if fake_provider:
                supporting = next(
                    (
                        chunk
                        for chunk in retrieval.evidence
                        if _supports(case, chunk)
                    ),
                    None,
                )

                class FixtureClient:
                    @staticmethod
                    def generate(system_prompt: str, user_prompt: str) -> str:
                        del system_prompt, user_prompt
                        return json.dumps(
                            {
                                "answer": (
                                    "Fixture-grounded answer"
                                    if supporting
                                    else "Không đủ bằng chứng"
                                ),
                                "isConfident": bool(supporting),
                                "usedChunkIds": (
                                    [supporting.chunk_id] if supporting else []
                                ),
                                "limitations": (
                                    None if supporting else "Không đủ bằng chứng"
                                ),
                            }
                        )

                case_client = FixtureClient()  # type: ignore[assignment]
            generated = generate_grounded_answer(
                case.question,
                case.company_code,
                case.fiscal_year,
                case.document_types,
                retriever=lambda *args, result=retrieval, **kwargs: result,
                client=case_client,
            )
            cited_chunks = [
                chunks_by_id[item.chunk_id]
                for item in generated.evidence
                if item.chunk_id in chunks_by_id
            ]
            total_citations += len(cited_chunks)
            supporting_citations += sum(
                _supports(case, chunk) for chunk in cited_chunks
            )
            correct_abstentions += int(
                not case.should_be_confident and not generated.is_confident
            )
            confidence_matches += int(
                generated.is_confident == case.should_be_confident
            )

        rows.append(
            {
                "id": case.id,
                "category": case.category,
                "recallHit": recall_hit if case.should_be_confident else None,
                "retrievedChunkIds": list(chunks_by_id),
                "retrievedPages": [
                    chunk.page_number for chunk in retrieval.evidence
                ],
                "isConfident": (
                    generated.is_confident if generated is not None else None
                ),
                "citedChunkIds": (
                    [chunk.chunk_id for chunk in cited_chunks]
                    if generated is not None
                    else None
                ),
                "durationMs": round(retrieval.duration_ms, 2),
            }
        )

    recall = recall_hits / len(answerable) if answerable else 1.0
    citation_precision = (
        supporting_citations / total_citations if total_citations else None
    )
    abstention_accuracy = (
        correct_abstentions / len(unsupported)
        if use_provider and unsupported
        else None
    )
    confidence_accuracy = (
        confidence_matches / len(cases) if use_provider and cases else None
    )
    durations = [float(row["durationMs"]) for row in rows]
    cold_start_ms = durations[0] if durations else 0.0
    retrieval_p95 = _p95(durations[1:] or durations)
    passed = recall >= 0.8 and retrieval_p95 <= 300
    if use_provider:
        passed = (
            passed
            and citation_precision == 1.0
            and abstention_accuracy == 1.0
        )

    return {
        "mode": (
            "live_provider"
            if live_provider
            else "fake_provider" if fake_provider else "retrieval_only"
        ),
        "fixtureCount": len(cases),
        "metrics": {
            "recallAt5": round(recall, 4),
            "citationPrecision": (
                round(citation_precision, 4)
                if citation_precision is not None
                else None
            ),
            "abstentionAccuracy": (
                round(abstention_accuracy, 4)
                if abstention_accuracy is not None
                else None
            ),
            "confidenceAccuracy": (
                round(confidence_accuracy, 4)
                if confidence_accuracy is not None
                else None
            ),
            "coldStartMs": round(cold_start_ms, 2),
            "retrievalP95Ms": round(retrieval_p95, 2),
        },
        "thresholds": {
            "recallAt5": 0.8,
            "citationPrecision": 1.0,
            "abstentionAccuracy": 1.0,
            "retrievalP95Ms": 300,
        },
        "passed": passed,
        "cases": rows,
    }


def write_reports(report: dict[str, object], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.with_suffix(".json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    metrics = report["metrics"]
    assert isinstance(metrics, dict)
    lines = [
        "# RAG evaluation report",
        "",
        f"- Mode: `{report['mode']}`",
        f"- Cases: `{report['fixtureCount']}`",
        f"- Recall@5: `{metrics['recallAt5']}`",
        f"- Citation precision: `{metrics['citationPrecision']}`",
        f"- Abstention accuracy: `{metrics['abstentionAccuracy']}`",
        f"- Cold start: `{metrics['coldStartMs']} ms`",
        f"- Retrieval p95: `{metrics['retrievalP95Ms']} ms`",
        f"- Passed: `{report['passed']}`",
        "",
        "| Case | Category | Recall hit | Confident | Retrieval ms |",
        "|---|---|---:|---:|---:|",
    ]
    rows = report["cases"]
    assert isinstance(rows, list)
    lines.extend(
        f"| {row['id']} | {row['category']} | {row['recallHit']} | "
        f"{row['isConfident']} | {row['durationMs']} |"
        for row in rows
    )
    output.with_suffix(".md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Evaluate WikiStock RAG")
    parser.add_argument(
        "--fixture",
        type=Path,
        default=Path("tests/fixtures/rag_evaluation.json"),
    )
    parser.add_argument(
        "--output", type=Path, default=Path("reports/rag_evaluation")
    )
    provider = parser.add_mutually_exclusive_group()
    provider.add_argument("--live-provider", action="store_true")
    provider.add_argument("--fake-provider", action="store_true")
    args = parser.parse_args(argv)
    settings = RetrievalSettings.from_env()
    client = (
        AiGatewayClient(AiSettings.from_env()) if args.live_provider else None
    )
    report = evaluate(
        load_cases(args.fixture),
        settings,
        live_provider=args.live_provider,
        fake_provider=args.fake_provider,
        client=client,
    )
    write_reports(report, args.output)
    print(json.dumps(report["metrics"], sort_keys=True))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
