from __future__ import annotations

import os
import time
import unittest
import uuid
from unittest.mock import Mock

import psycopg
from pgvector.psycopg import register_vector

from app.config import RetrievalSettings
from app.database import RetrievalDatabase
from app.models import RetrievalError, RetrievedChunk
from app.retrieval import normalize_request, retrieve_evidence


def _chunk(chunk_id: int, similarity: float) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id,
        10,
        "FPT report",
        3,
        "Trang 3",
        "Revenue evidence",
        similarity,
        "FPT",
        2026,
        "financial_statement",
    )


class RetrievalUnitTests(unittest.TestCase):
    def test_normalizes_request_filters(self) -> None:
        normalized = normalize_request(
            "  Doanh thu là bao nhiêu?  ",
            " fpt ",
            2026,
            (" Financial_Statement ", "financial_statement"),
        )
        self.assertEqual(
            normalized,
            (
                "Doanh thu là bao nhiêu?",
                "FPT",
                2026,
                ("financial_statement",),
            ),
        )

    def test_rejects_invalid_request_fields(self) -> None:
        cases = (
            ((" ", "FPT", None, ()), "INVALID_QUERY"),
            ((("x" * 2001), "FPT", None, ()), "INVALID_QUERY"),
            (("query", "FPT!", None, ()), "INVALID_COMPANY_CODE"),
            (("query", "FPT", 1899, ()), "INVALID_YEAR"),
            (("query", "FPT", None, ("bad type",)), "INVALID_DOCUMENT_TYPE"),
        )
        for arguments, code in cases:
            with self.subTest(code=code), self.assertRaises(RetrievalError) as context:
                normalize_request(*arguments)
            self.assertEqual(context.exception.code, code)

    def test_rejects_unknown_filters_before_embedding(self) -> None:
        database = Mock()
        database.filter_state.return_value = (False, frozenset())
        embedder = Mock()

        with self.assertRaises(RetrievalError) as context:
            retrieve_evidence(
                "query",
                "FPT",
                settings=RetrievalSettings(database_url="unused"),
                database=database,
                embedder=embedder,
            )

        self.assertEqual(context.exception.code, "UNKNOWN_COMPANY_CODE")
        embedder.assert_not_called()

        database.filter_state.return_value = (True, frozenset())
        with self.assertRaises(RetrievalError) as context:
            retrieve_evidence(
                "query",
                "FPT",
                document_types=("annual_report",),
                settings=RetrievalSettings(database_url="unused"),
                database=database,
                embedder=embedder,
            )
        self.assertEqual(context.exception.code, "UNKNOWN_DOCUMENT_TYPE")
        embedder.assert_not_called()

    def test_filters_by_threshold_and_preserves_rank(self) -> None:
        database = Mock()
        database.filter_state.return_value = (
            True,
            frozenset({"financial_statement"}),
        )
        database.retrieve_chunks.return_value = [
            _chunk(1, 0.9),
            _chunk(2, 0.6),
            _chunk(3, 0.2),
        ]

        result = retrieve_evidence(
            "  revenue  ",
            "fpt",
            2026,
            ("financial_statement",),
            settings=RetrievalSettings(
                database_url="unused", top_k=3, min_similarity=0.5
            ),
            database=database,
            embedder=lambda texts, model, batch: [[1.0] + [0.0] * 1023],
        )

        self.assertTrue(result.is_confident)
        self.assertEqual([chunk.chunk_id for chunk in result.evidence], [1, 2])
        database.retrieve_chunks.assert_called_once_with(
            [1.0] + [0.0] * 1023,
            "FPT",
            2026,
            ("financial_statement",),
            3,
        )

    def test_returns_empty_evidence_below_threshold(self) -> None:
        database = Mock()
        database.filter_state.return_value = (True, frozenset())
        database.retrieve_chunks.return_value = [_chunk(1, 0.34)]

        result = retrieve_evidence(
            "query",
            "FPT",
            settings=RetrievalSettings(database_url="unused"),
            database=database,
            embedder=lambda texts, model, batch: [[1.0] + [0.0] * 1023],
        )

        self.assertFalse(result.is_confident)
        self.assertEqual(result.evidence, ())

    def test_maps_database_failure_without_exposing_details(self) -> None:
        database = Mock()
        database.filter_state.side_effect = psycopg.OperationalError(
            "password=must-not-escape"
        )

        with self.assertRaises(RetrievalError) as context:
            retrieve_evidence(
                "query",
                "FPT",
                settings=RetrievalSettings(database_url="unused"),
                database=database,
            )

        self.assertEqual(context.exception.code, "DATABASE_UNAVAILABLE")
        self.assertNotIn("must-not-escape", str(context.exception))


@unittest.skipUnless(os.getenv("TEST_DATABASE_URL"), "TEST_DATABASE_URL is not set")
class RetrievalIntegrationTests(unittest.TestCase):
    def test_filters_and_ranks_inside_pgvector_query(self) -> None:
        database_url = os.environ["TEST_DATABASE_URL"]
        database = RetrievalDatabase(database_url)
        marker = f"r5-{uuid.uuid4().hex}"
        other_type = f"r5_type_{uuid.uuid4().hex}"
        unit = [1.0] + [0.0] * 1023
        diagonal = [0.8, 0.6] + [0.0] * 1022
        orthogonal = [0.0, 1.0] + [0.0] * 1022

        with psycopg.connect(database_url) as connection:
            register_vector(connection)
            source_id = connection.execute(
                "SELECT source_id FROM data_source "
                "WHERE source_name = 'WikiStock seed PDF'"
            ).fetchone()[0]
            financial_type_id = connection.execute(
                "SELECT doc_type_id FROM document_type "
                "WHERE type_name = 'financial_statement'"
            ).fetchone()[0]
            other_type_id = connection.execute(
                "INSERT INTO document_type (type_name) "
                "VALUES (%s) RETURNING doc_type_id",
                (other_type,),
            ).fetchone()[0]
            companies = dict(
                connection.execute(
                    "SELECT ticker, company_id FROM company "
                    "WHERE ticker IN ('FPT', 'GAS')"
                ).fetchall()
            )

            def insert_chunk(
                ticker: str,
                year: int,
                status: str,
                doc_type_id: int,
                embedding: list[float],
                suffix: str,
            ) -> int:
                document_id = connection.execute(
                    """
                    INSERT INTO source_document (
                        company_id, source_id, doc_type_id, title, fiscal_year,
                        file_ref, checksum, ingestion_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING document_id
                    """,
                    (
                        companies[ticker],
                        source_id,
                        doc_type_id,
                        f"{marker}-{suffix}",
                        year,
                        f"{marker}/{suffix}.pdf",
                        uuid.uuid4().hex * 2,
                        status,
                    ),
                ).fetchone()[0]
                return connection.execute(
                    """
                    INSERT INTO document_chunk (
                        document_id, chunk_index, page_number, location_ref,
                        content, char_count, content_hash, embedding
                    ) VALUES (%s, 0, 1, 'Trang 1', %s, 8, %s, %s)
                    RETURNING chunk_id
                    """,
                    (document_id, suffix, uuid.uuid4().hex * 2, embedding),
                ).fetchone()[0]

            expected_first = insert_chunk(
                "FPT", 2026, "ready", financial_type_id, unit, "fpt-best"
            )
            expected_second = insert_chunk(
                "FPT", 2026, "ready", financial_type_id, diagonal, "fpt-second"
            )
            insert_chunk(
                "FPT", 2026, "ready", financial_type_id, orthogonal, "fpt-third"
            )
            insert_chunk("GAS", 2026, "ready", financial_type_id, unit, "gas")
            insert_chunk("FPT", 2025, "ready", financial_type_id, unit, "old-year")
            pending_chunk = insert_chunk(
                "FPT", 2026, "pending", financial_type_id, unit, "pending"
            )
            other_type_chunk = insert_chunk(
                "FPT", 2026, "ready", other_type_id, unit, "other-type"
            )

        try:
            rows = database.retrieve_chunks(
                unit, "FPT", 2026, ("financial_statement",), 2
            )
            self.assertEqual(
                [row.chunk_id for row in rows], [expected_first, expected_second]
            )
            self.assertEqual([row.company_code for row in rows], ["FPT", "FPT"])
            self.assertEqual([row.fiscal_year for row in rows], [2026, 2026])
            self.assertGreaterEqual(rows[0].similarity, rows[1].similarity)
            self.assertNotIn(pending_chunk, [row.chunk_id for row in rows])

            typed = database.retrieve_chunks(unit, "FPT", 2026, (other_type,), 5)
            self.assertEqual([row.chunk_id for row in typed], [other_type_chunk])

            durations = []
            for _ in range(30):
                started = time.perf_counter()
                database.retrieve_chunks(
                    unit, "FPT", 2026, ("financial_statement",), 5
                )
                durations.append((time.perf_counter() - started) * 1000)
            durations.sort()
            p95 = durations[int(len(durations) * 0.95) - 1]
            self.assertLess(p95, 300, f"retrieval p95 was {p95:.2f} ms")
        finally:
            with psycopg.connect(database_url) as connection:
                connection.execute(
                    "DELETE FROM source_document WHERE file_ref LIKE %s",
                    (f"{marker}/%",),
                )
                connection.execute(
                    "DELETE FROM document_type WHERE doc_type_id = %s",
                    (other_type_id,),
                )


if __name__ == "__main__":
    unittest.main()
