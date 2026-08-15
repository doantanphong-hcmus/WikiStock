from __future__ import annotations

from typing import Sequence

import psycopg
from pgvector.psycopg import register_vector

from app.models import DocumentChunk, DocumentMetadata, IngestionError, RetrievedChunk


SOURCE_NAME = "WikiStock seed PDF"
DOCUMENT_TYPE = "financial_statement"


class IngestionDatabase:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def document_state(
        self, checksum: str
    ) -> tuple[str, str | None, str | None] | None:
        with psycopg.connect(self.database_url) as connection:
            row = connection.execute(
                """
                SELECT ingestion_status, embedding_model, chunk_version
                FROM source_document
                WHERE checksum = %s
                """,
                (checksum,),
            ).fetchone()
        return row

    def prepare_document(
        self,
        metadata: DocumentMetadata,
        title: str,
        file_ref: str,
        checksum: str,
    ) -> int:
        with psycopg.connect(self.database_url) as connection:
            company = connection.execute(
                "SELECT company_id FROM company WHERE ticker = %s",
                (metadata.company_code,),
            ).fetchone()
            source = connection.execute(
                "SELECT source_id FROM data_source WHERE source_name = %s",
                (SOURCE_NAME,),
            ).fetchone()
            document_type = connection.execute(
                "SELECT doc_type_id FROM document_type WHERE type_name = %s",
                (DOCUMENT_TYPE,),
            ).fetchone()
            if not company or not source or not document_type:
                raise IngestionError(
                    "REFERENCE_DATA_MISSING",
                    "Run seed.sql before ingestion; company/source/document type is missing",
                )
            row = connection.execute(
                """
                INSERT INTO source_document (
                    company_id, source_id, doc_type_id, title, fiscal_year,
                    fiscal_quarter, file_ref, checksum, ingestion_status,
                    ingestion_error
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'processing', NULL)
                ON CONFLICT (checksum) DO UPDATE SET
                    company_id = EXCLUDED.company_id,
                    source_id = EXCLUDED.source_id,
                    doc_type_id = EXCLUDED.doc_type_id,
                    title = EXCLUDED.title,
                    fiscal_year = EXCLUDED.fiscal_year,
                    fiscal_quarter = EXCLUDED.fiscal_quarter,
                    file_ref = EXCLUDED.file_ref,
                    crawled_at = now(),
                    ingestion_status = 'processing',
                    ingested_at = NULL,
                    ingestion_error = NULL
                RETURNING document_id
                """,
                (
                    company[0],
                    source[0],
                    document_type[0],
                    title,
                    metadata.fiscal_year,
                    metadata.fiscal_quarter,
                    file_ref,
                    checksum,
                ),
            ).fetchone()
            assert row is not None
            return row[0]

    def replace_chunks(
        self,
        document_id: int,
        chunks: Sequence[DocumentChunk],
        embeddings: Sequence[Sequence[float]],
        embedding_model: str,
        chunk_version: str,
    ) -> None:
        with psycopg.connect(self.database_url) as connection:
            register_vector(connection)
            connection.execute(
                "SELECT document_id FROM source_document WHERE document_id = %s FOR UPDATE",
                (document_id,),
            )
            connection.execute(
                "DELETE FROM citation WHERE document_id = %s", (document_id,)
            )
            connection.execute(
                "DELETE FROM document_chunk WHERE document_id = %s", (document_id,)
            )
            # ponytail: row inserts fit the seed set; use COPY only if measured slow.
            for chunk, embedding in zip(chunks, embeddings, strict=True):
                row = connection.execute(
                    """
                    INSERT INTO document_chunk (
                        document_id, chunk_index, page_number, location_ref,
                        content, char_count, content_hash, embedding
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING chunk_id
                    """,
                    (
                        document_id,
                        chunk.chunk_index,
                        chunk.page_number,
                        chunk.location_ref,
                        chunk.content,
                        chunk.char_count,
                        chunk.content_hash,
                        list(embedding),
                    ),
                ).fetchone()
                assert row is not None
                connection.execute(
                    """
                    INSERT INTO citation (document_id, chunk_id, excerpt, location_ref)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (document_id, row[0], chunk.content, chunk.location_ref),
                )
            connection.execute(
                """
                UPDATE source_document
                SET ingestion_status = 'ready', ingested_at = now(),
                    ingestion_error = NULL, embedding_model = %s,
                    chunk_version = %s
                WHERE document_id = %s
                """,
                (embedding_model, chunk_version, document_id),
            )

    def mark_failed(self, document_id: int, error_message: str) -> None:
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                """
                UPDATE source_document
                SET ingestion_status = 'failed', ingestion_error = %s
                WHERE document_id = %s
                """,
                (error_message[:500], document_id),
            )


class RetrievalDatabase:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def filter_state(
        self, company_code: str, document_types: Sequence[str]
    ) -> tuple[bool, frozenset[str]]:
        with psycopg.connect(self.database_url) as connection:
            company_exists = connection.execute(
                "SELECT EXISTS (SELECT 1 FROM company WHERE ticker = %s)",
                (company_code,),
            ).fetchone()[0]
            known_types = frozenset()
            if document_types:
                known_types = frozenset(
                    row[0]
                    for row in connection.execute(
                        "SELECT type_name FROM document_type WHERE type_name = ANY(%s)",
                        (list(document_types),),
                    )
                )
        return company_exists, known_types

    def retrieve_chunks(
        self,
        query_embedding: Sequence[float],
        company_code: str,
        fiscal_year: int | None,
        document_types: Sequence[str],
        top_k: int,
    ) -> list[RetrievedChunk]:
        conditions = [
            "company.ticker = %s",
            "document.ingestion_status = 'ready'",
            "chunk.embedding IS NOT NULL",
        ]
        parameters: list[object] = [list(query_embedding), company_code]
        if fiscal_year is not None:
            conditions.append("document.fiscal_year = %s")
            parameters.append(fiscal_year)
        if document_types:
            conditions.append("document_type.type_name = ANY(%s)")
            parameters.append(list(document_types))
        parameters.append(top_k)

        with psycopg.connect(self.database_url) as connection:
            register_vector(connection)
            rows = connection.execute(
                f"""
                SELECT chunk.chunk_id, document.document_id, document.title,
                       chunk.page_number, chunk.location_ref, chunk.content,
                       1 - (chunk.embedding <=> %s::vector) AS similarity,
                       company.ticker, document.fiscal_year,
                       document_type.type_name
                FROM document_chunk chunk
                JOIN source_document document
                  ON document.document_id = chunk.document_id
                JOIN company ON company.company_id = document.company_id
                JOIN document_type
                  ON document_type.doc_type_id = document.doc_type_id
                WHERE {' AND '.join(conditions)}
                ORDER BY similarity DESC, chunk.chunk_id
                LIMIT %s
                """,
                parameters,
            ).fetchall()
        return [RetrievedChunk(*row) for row in rows]
