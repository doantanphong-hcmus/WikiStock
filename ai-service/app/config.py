from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _positive_int(name: str, default: int) -> int:
    raw_value = os.getenv(name, str(default))
    try:
        value = int(raw_value)
    except ValueError as error:
        raise ValueError(f"{name} must be an integer") from error
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return value


def _similarity(name: str, default: float) -> float:
    try:
        value = float(os.getenv(name, str(default)))
    except ValueError as error:
        raise ValueError(f"{name} must be a number") from error
    if not -1 <= value <= 1:
        raise ValueError(f"{name} must be between -1 and 1")
    return value


def _positive_float(name: str, default: float) -> float:
    try:
        value = float(os.getenv(name, str(default)))
    except ValueError as error:
        raise ValueError(f"{name} must be a number") from error
    if value <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return value


def _ai_env(name: str, legacy_name: str, default: str) -> str:
    return os.getenv(name, os.getenv(legacy_name, default))


@dataclass(frozen=True)
class IngestionSettings:
    seed_data_path: Path
    max_pdf_size_mb: int = 100
    chunk_size_chars: int = 1800
    chunk_overlap_chars: int = 200
    chunk_version: str = "v1-page-block-1800-200"
    database_url: str = ""
    embedding_model: str = "BAAI/bge-m3"
    embedding_dimensions: int = 1024
    embedding_batch_size: int = 8

    def __post_init__(self) -> None:
        if self.max_pdf_size_mb <= 0:
            raise ValueError("max_pdf_size_mb must be greater than zero")
        if self.chunk_size_chars <= 0:
            raise ValueError("chunk_size_chars must be greater than zero")
        if not 0 <= self.chunk_overlap_chars < self.chunk_size_chars:
            raise ValueError(
                "chunk_overlap_chars must be non-negative and smaller than chunk_size_chars"
            )
        if not self.chunk_version.strip():
            raise ValueError("chunk_version must not be empty")
        if not self.embedding_model.strip():
            raise ValueError("EMBEDDING_MODEL must not be empty")
        if self.embedding_dimensions <= 0:
            raise ValueError("EMBEDDING_DIMENSIONS must be greater than zero")
        if self.embedding_batch_size <= 0:
            raise ValueError("EMBEDDING_BATCH_SIZE must be greater than zero")

    @classmethod
    def from_env(cls) -> "IngestionSettings":
        return cls(
            seed_data_path=Path(os.getenv("SEED_DATA_PATH", "/data/seed_data")),
            max_pdf_size_mb=_positive_int("MAX_PDF_SIZE_MB", 100),
            chunk_size_chars=_positive_int("CHUNK_SIZE_CHARS", 1800),
            chunk_overlap_chars=int(os.getenv("CHUNK_OVERLAP_CHARS", "200")),
            chunk_version=os.getenv(
                "CHUNK_VERSION", "v1-page-block-1800-200"
            ),
            database_url=os.getenv("DATABASE_URL", ""),
            embedding_model=os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3"),
            embedding_dimensions=_positive_int("EMBEDDING_DIMENSIONS", 1024),
            embedding_batch_size=_positive_int("EMBEDDING_BATCH_SIZE", 8),
        )


@dataclass(frozen=True)
class RetrievalSettings:
    database_url: str = ""
    embedding_model: str = "BAAI/bge-m3"
    embedding_dimensions: int = 1024
    embedding_batch_size: int = 8
    top_k: int = 5
    min_similarity: float = 0.35

    def __post_init__(self) -> None:
        if not self.embedding_model.strip():
            raise ValueError("EMBEDDING_MODEL must not be empty")
        if self.embedding_dimensions <= 0:
            raise ValueError("EMBEDDING_DIMENSIONS must be greater than zero")
        if self.embedding_batch_size <= 0:
            raise ValueError("EMBEDDING_BATCH_SIZE must be greater than zero")
        if self.top_k <= 0:
            raise ValueError("RETRIEVAL_TOP_K must be greater than zero")
        if not -1 <= self.min_similarity <= 1:
            raise ValueError("RETRIEVAL_MIN_SIMILARITY must be between -1 and 1")

    @classmethod
    def from_env(cls) -> "RetrievalSettings":
        return cls(
            database_url=os.getenv("DATABASE_URL", ""),
            embedding_model=os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3"),
            embedding_dimensions=_positive_int("EMBEDDING_DIMENSIONS", 1024),
            embedding_batch_size=_positive_int("EMBEDDING_BATCH_SIZE", 8),
            top_k=_positive_int("RETRIEVAL_TOP_K", 5),
            min_similarity=_similarity("RETRIEVAL_MIN_SIMILARITY", 0.35),
        )


@dataclass(frozen=True)
class AiSettings:
    provider: str = "demo"
    base_url: str = "https://claude.zunef.com/v1/ai"
    api_key: str = ""
    model: str = "claude-sonnet-4-6"
    connect_timeout_seconds: float = 5
    read_timeout_seconds: float = 45

    def __post_init__(self) -> None:
        if self.provider not in {"demo", "claude_proxy"}:
            raise ValueError("AI_PROVIDER must be demo or claude_proxy")
        if not self.base_url.strip():
            raise ValueError("AI_API_BASE_URL must not be empty")
        if not self.model.strip():
            raise ValueError("AI_MODEL must not be empty")
        if self.connect_timeout_seconds <= 0:
            raise ValueError("AI_CONNECT_TIMEOUT_SECONDS must be greater than zero")
        if self.read_timeout_seconds <= 0:
            raise ValueError("AI_READ_TIMEOUT_SECONDS must be greater than zero")

    @classmethod
    def from_env(cls) -> "AiSettings":
        return cls(
            provider=os.getenv("AI_PROVIDER", "demo").strip().lower(),
            base_url=_ai_env(
                "AI_API_BASE_URL",
                "CLAUDE_API_BASE_URL",
                "https://claude.zunef.com/v1/ai",
            ),
            api_key=_ai_env("AI_API_KEY", "CLAUDE_API_KEY", ""),
            model=_ai_env("AI_MODEL", "CLAUDE_MODEL", "claude-sonnet-4-6"),
            connect_timeout_seconds=_positive_float(
                "AI_CONNECT_TIMEOUT_SECONDS",
                float(os.getenv("CLAUDE_CONNECT_TIMEOUT_SECONDS", "5")),
            ),
            read_timeout_seconds=_positive_float(
                "AI_READ_TIMEOUT_SECONDS",
                float(os.getenv("CLAUDE_READ_TIMEOUT_SECONDS", "45")),
            ),
        )
