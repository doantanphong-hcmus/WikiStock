from __future__ import annotations

import os
import tempfile
import unittest
import uuid
from pathlib import Path

import psycopg
import pymupdf

from app.config import IngestionSettings
from app.database import IngestionDatabase
from app.embeddings import validate_embeddings
from app.ingestion import IngestionError, ingest
from app.models import DocumentChunk


class EmbeddingValidationTests(unittest.TestCase):
    def test_rejects_wrong_dimension_and_non_finite_or_zero_vectors(self) -> None:
        invalid_vectors = ([1.0, 2.0], [float("nan")] * 3, [0.0] * 3)
        for vector in invalid_vectors:
            with self.subTest(vector=vector), self.assertRaises(IngestionError):
                validate_embeddings([vector], 1, 3)


@unittest.skipUnless(os.getenv("TEST_DATABASE_URL"), "TEST_DATABASE_URL is not set")
class PersistenceIntegrationTests(unittest.TestCase):
    def test_idempotency_and_replacement_rollback(self) -> None:
        database_url = os.environ["TEST_DATABASE_URL"]
        database = IngestionDatabase(database_url)

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ticker_dir = root / "HPG"
            ticker_dir.mkdir()
            pdf_path = ticker_dir / f"r4a-{uuid.uuid4().hex}_Q1_2026.pdf"
            file_ref = f"HPG/{pdf_path.name}"
            document = pymupdf.open()
            document.new_page().insert_text((72, 72), "Revenue and profit " * 20)
            document.save(pdf_path)
            document.close()

            settings = IngestionSettings(root, database_url=database_url)

            def fake_embedder(texts, _model, _batch):
                return [[1.0] + [0.0] * 1023 for _ in texts]

            try:
                first, failed = ingest(settings, database, fake_embedder)
                self.assertEqual(failed, 0)
                self.assertEqual(first[0]["status"], "inserted")

                checksum = first[0]["checksum"]
                with psycopg.connect(database_url) as connection:
                    document_id = connection.execute(
                        "SELECT document_id FROM source_document WHERE checksum = %s",
                        (checksum,),
                    ).fetchone()[0]
                    original_count = connection.execute(
                        "SELECT count(*) FROM document_chunk WHERE document_id = %s",
                        (document_id,),
                    ).fetchone()[0]
                    citation_count = connection.execute(
                        "SELECT count(*) FROM citation WHERE document_id = %s",
                        (document_id,),
                    ).fetchone()[0]
                self.assertEqual(original_count, citation_count)

                invalid_chunk = DocumentChunk(0, 1, "Trang 1", "bad", 0, "0" * 64)
                with self.assertRaises(psycopg.errors.CheckViolation):
                    database.replace_chunks(
                        document_id,
                        [invalid_chunk],
                        [[1.0] + [0.0] * 1023],
                        settings.embedding_model,
                        settings.chunk_version,
                    )
                with psycopg.connect(database_url) as connection:
                    self.assertEqual(
                        connection.execute(
                            "SELECT count(*) FROM document_chunk WHERE document_id = %s",
                            (document_id,),
                        ).fetchone()[0],
                        original_count,
                    )

                second, failed = ingest(settings, database, fake_embedder)
                self.assertEqual(failed, 0)
                self.assertEqual(second[0]["status"], "skipped")

                changed_settings = IngestionSettings(
                    root, database_url=database_url, chunk_version="test-v2"
                )
                third, failed = ingest(changed_settings, database, fake_embedder)
                self.assertEqual(failed, 0)
                self.assertEqual(third[0]["status"], "reingested")
                with psycopg.connect(database_url) as connection:
                    orphan_count = connection.execute(
                        """
                        SELECT count(*)
                        FROM citation citation
                        LEFT JOIN document_chunk chunk ON chunk.chunk_id = citation.chunk_id
                        WHERE citation.document_id = %s AND chunk.chunk_id IS NULL
                        """,
                        (document_id,),
                    ).fetchone()[0]
                self.assertEqual(orphan_count, 0)
            finally:
                with psycopg.connect(database_url) as connection:
                    connection.execute(
                        "DELETE FROM citation WHERE document_id IN "
                        "(SELECT document_id FROM source_document WHERE file_ref = %s)",
                        (file_ref,),
                    )
                    connection.execute(
                        "DELETE FROM source_document WHERE file_ref = %s",
                        (file_ref,),
                    )


if __name__ == "__main__":
    unittest.main()
