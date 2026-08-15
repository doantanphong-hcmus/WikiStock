from __future__ import annotations

import logging
import re
import time
from datetime import date
from typing import Callable, Sequence

from app.config import RetrievalSettings
from app.database import RetrievalDatabase
from app.embeddings import embed_texts, validate_embeddings
from app.models import RetrievalError, RetrievalResult


LOGGER = logging.getLogger(__name__)
_COMPANY_CODE = re.compile(r"^[A-Z0-9]{1,10}$")
_DOCUMENT_TYPE = re.compile(r"^[a-z0-9_]{1,100}$")


def normalize_request(
    query: str,
    company_code: str,
    fiscal_year: int | None = None,
    document_types: Sequence[str] = (),
) -> tuple[str, str, int | None, tuple[str, ...]]:
    normalized_query = query.strip() if isinstance(query, str) else ""
    if not normalized_query:
        raise RetrievalError("INVALID_QUERY", "Query must not be empty")
    if len(normalized_query) > 2000:
        raise RetrievalError("INVALID_QUERY", "Query must not exceed 2000 characters")

    normalized_company = (
        company_code.strip().upper() if isinstance(company_code, str) else ""
    )
    if not _COMPANY_CODE.fullmatch(normalized_company):
        raise RetrievalError("INVALID_COMPANY_CODE", "Company code is invalid")

    if fiscal_year is not None and (
        isinstance(fiscal_year, bool)
        or not isinstance(fiscal_year, int)
        or not 1900 <= fiscal_year <= date.today().year + 1
    ):
        raise RetrievalError("INVALID_YEAR", "Fiscal year is invalid")

    normalized_types: list[str] = []
    for document_type in document_types:
        value = document_type.strip().lower() if isinstance(document_type, str) else ""
        if not _DOCUMENT_TYPE.fullmatch(value):
            raise RetrievalError("INVALID_DOCUMENT_TYPE", "Document type is invalid")
        if value not in normalized_types:
            normalized_types.append(value)
    return normalized_query, normalized_company, fiscal_year, tuple(normalized_types)


def retrieve_evidence(
    query: str,
    company_code: str,
    fiscal_year: int | None = None,
    document_types: Sequence[str] = (),
    *,
    settings: RetrievalSettings | None = None,
    database: RetrievalDatabase | None = None,
    embedder: Callable[[Sequence[str], str, int], list[list[float]]] | None = None,
) -> RetrievalResult:
    started = time.perf_counter()
    settings = settings or RetrievalSettings.from_env()
    if database is None and not settings.database_url:
        raise RetrievalError("DATABASE_URL_REQUIRED", "DATABASE_URL is required")
    database = database or RetrievalDatabase(settings.database_url)
    embedder = embedder or embed_texts
    query, company_code, fiscal_year, document_types = normalize_request(
        query, company_code, fiscal_year, document_types
    )

    company_exists, known_types = database.filter_state(company_code, document_types)
    if not company_exists:
        raise RetrievalError("UNKNOWN_COMPANY_CODE", "Company code does not exist")
    unknown_types = set(document_types) - known_types
    if unknown_types:
        raise RetrievalError(
            "UNKNOWN_DOCUMENT_TYPE",
            f"Unknown document type: {sorted(unknown_types)[0]}",
        )

    embeddings = embedder(
        [query], settings.embedding_model, settings.embedding_batch_size
    )
    validate_embeddings(embeddings, 1, settings.embedding_dimensions)
    candidates = database.retrieve_chunks(
        embeddings[0], company_code, fiscal_year, document_types, settings.top_k
    )
    evidence = tuple(
        chunk for chunk in candidates if chunk.similarity >= settings.min_similarity
    )
    duration_ms = (time.perf_counter() - started) * 1000
    LOGGER.info(
        "rag_retrieval company=%s year=%s types=%s confident=%s "
        "chunk_ids=%s scores=%s duration_ms=%.2f",
        company_code,
        fiscal_year,
        list(document_types),
        bool(evidence),
        [chunk.chunk_id for chunk in evidence],
        [round(chunk.similarity, 4) for chunk in evidence],
        duration_ms,
    )
    return RetrievalResult(bool(evidence), evidence, duration_ms)
