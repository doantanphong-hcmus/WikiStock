from __future__ import annotations

import math
from functools import lru_cache
from typing import Sequence

from app.models import IngestionError


@lru_cache(maxsize=1)
def _load_model(model_name: str):
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


def embed_texts(
    texts: Sequence[str], model_name: str, batch_size: int
) -> list[list[float]]:
    try:
        vectors = _load_model(model_name).encode(
            list(texts),
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vectors.tolist()
    except Exception as error:
        raise IngestionError(
            "EMBEDDING_FAILED",
            f"{type(error).__name__} while loading or encoding {model_name}",
        ) from error


def validate_embeddings(
    embeddings: Sequence[Sequence[float]], expected_count: int, dimensions: int
) -> None:
    if len(embeddings) != expected_count:
        raise IngestionError(
            "EMBEDDING_COUNT_MISMATCH",
            f"Expected {expected_count} embeddings, received {len(embeddings)}",
        )
    for index, embedding in enumerate(embeddings):
        if len(embedding) != dimensions:
            raise IngestionError(
                "EMBEDDING_DIMENSION_MISMATCH",
                f"Embedding {index} has {len(embedding)} dimensions; expected {dimensions}",
            )
        if not all(math.isfinite(value) for value in embedding):
            raise IngestionError(
                "INVALID_EMBEDDING", f"Embedding {index} contains NaN or infinity"
            )
        if not any(value != 0 for value in embedding):
            raise IngestionError(
                "INVALID_EMBEDDING", f"Embedding {index} is a zero vector"
            )
