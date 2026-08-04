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
