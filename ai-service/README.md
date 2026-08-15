# WikiStock AI Service

## AI gateway contract

The current gateway is Anthropic Messages-compatible. The API key must only exist in a local
`.env` file or a secret store; never put it in a command, fixture, log, or Git.

| Item | Contract |
|---|---|
| Base URL | `https://claude-api.zunef.com/v1/ai` |
| List models | `GET /models` |
| Create message | `POST /messages` |
| Authentication | `x-api-key: $AI_API_KEY` |
| Request style | Anthropic Messages-compatible; live success verified |
| API version header | `anthropic-version: 2023-06-01`; accepted by Zunef |
| Verified model | `claude-sonnet-4-6` |
| JSON mode | Not documented; do not assume native JSON mode |
| Embeddings | Not documented; V1 continues to use local `BAAI/bge-m3` |

An unauthenticated `GET /models` was observed on 2026-08-03 to return HTTP 401
with `tests/fixtures/claude_401.json`.

A live `POST /messages` was successful on 2026-08-04. Its sanitized response is
stored in `tests/fixtures/claude_success.json`. The response placed a
`thinking` block before the `text` block, so consumers must select content by
`type == "text"` rather than reading `content[0]`.

### Live smoke test

Run this in Codespaces. The silent prompt prevents the key from entering shell
history. Use the exact model ID returned by `/models`.

```bash
export AI_API_BASE_URL='https://claude-api.zunef.com/v1/ai'
read -rsp 'AI API key: ' AI_API_KEY && echo

curl --silent --show-error --fail-with-body \
  --connect-timeout 5 --max-time 45 \
  -H "x-api-key: $AI_API_KEY" \
  "$AI_API_BASE_URL/models"

export AI_MODEL='claude-sonnet-4-6'
AI_REQUEST_BODY=$(printf '%s' \
  "{\"model\":\"$AI_MODEL\",\"max_tokens\":32,\"temperature\":0,\"messages\":[{\"role\":\"user\",\"content\":\"Reply with only: pong\"}]}")
curl --silent --show-error --fail-with-body \
  --connect-timeout 5 --max-time 45 \
  -H 'content-type: application/json' \
  -H 'anthropic-version: 2023-06-01' \
  -H "x-api-key: $AI_API_KEY" \
  "$AI_API_BASE_URL/messages" \
  --data "$AI_REQUEST_BODY"

unset AI_API_KEY AI_REQUEST_BODY
```

Before committing a captured response, remove dynamic IDs and inspect it for
the API key or personal data. Do not manufacture 429 or 5xx fixtures: capture
their real provider shape from documentation or an observed response.

## PDF preflight

R3 scans and validates PDF files without loading an embedding model, calling
Claude, or writing to PostgreSQL.

```bash
cd ai-service
python -m unittest discover -s tests

SEED_DATA_PATH='../docs/Seed_Daa/Báo cáo tài chính' \
  python -m app.ingestion scan --dry-run
```

With Docker Compose, the seed directory is mounted read-only at
`/data/seed_data`:

```bash
docker compose run --rm ai-service python -m app.ingestion scan --dry-run
```

## RAG ingestion persistence

The non-dry-run command stores text PDFs in PostgreSQL with normalized
`BAAI/bge-m3` vectors. A document is skipped when its checksum, embedding
model, chunk version, and `ready` status already match. Image-only PDFs are
reported as `needs_ocr` and remain untouched for the OCR task.

```bash
docker compose run --rm ai-service python -m app.ingestion scan
```

The first model download is cached in the `model_cache` Docker volume. To run
the database integration gate against the Compose database:

```bash
docker compose run --rm \
  -e TEST_DATABASE_URL='postgresql://app_user:app_password@postgres:5432/app_db' \
  ai-service python -m unittest discover -s tests
```

Acceptance query:

```bash
docker compose exec -T postgres psql -U app_user -d app_db -c "
SELECT d.file_ref, d.ingestion_status, d.embedding_model, d.chunk_version,
       count(DISTINCT ch.chunk_id) AS chunks,
       count(DISTINCT ci.citation_id) AS citations
FROM source_document d
LEFT JOIN document_chunk ch ON ch.document_id = d.document_id
LEFT JOIN citation ci ON ci.document_id = d.document_id
GROUP BY d.document_id
ORDER BY d.file_ref;"
```

## OCR backfill (R4B)

R4B reuses the ingestion command above. Point it at the searchable PDFs created
by the OCR step; do not copy generated PDFs into Git-tracked seed data.

On Windows without Docker, run from `ai-service` after starting a PostgreSQL
database that has `schema.sql`, `seed.sql`, and pgvector installed:

```powershell
$env:SEED_DATA_PATH = (Resolve-Path '..\runtime\ocr\output')
$env:DATABASE_URL = 'postgresql://app_user:app_password@localhost:5432/app_db'
python -m app.ingestion scan
```

With Docker Compose, run from the repository root:

```powershell
$env:RAG_SEED_DATA_PATH = './runtime/ocr/output'
docker compose run --rm ai-service python -m app.ingestion scan
Remove-Item Env:RAG_SEED_DATA_PATH
```

A complete first run discovers 12 PDFs and reports only `inserted` or
`skipped` documents. A second run must report 12 `skipped` documents and leave
database counts unchanged. The command exits non-zero if any PDF still needs
OCR or fails ingestion.

Verify the persisted batch:

```sql
SELECT d.file_ref, d.ingestion_status, d.fiscal_year, d.fiscal_quarter,
       d.embedding_model, d.chunk_version,
       count(DISTINCT ch.chunk_id) AS chunks,
       count(DISTINCT ci.citation_id) AS citations
FROM source_document d
JOIN data_source s ON s.source_id = d.source_id
LEFT JOIN document_chunk ch ON ch.document_id = d.document_id
LEFT JOIN citation ci ON ci.document_id = d.document_id
WHERE s.source_name = 'WikiStock seed PDF'
GROUP BY d.document_id
ORDER BY d.file_ref;

SELECT count(DISTINCT d.document_id) AS documents,
       count(DISTINCT d.document_id) FILTER (
           WHERE d.ingestion_status = 'ready'
       ) AS ready,
       count(DISTINCT d.document_id) - count(DISTINCT d.checksum)
           AS duplicate_checksums,
       count(*) FILTER (
           WHERE ch.embedding IS NULL OR vector_dims(ch.embedding) <> 1024
       ) AS invalid_embeddings
FROM source_document d
JOIN data_source s ON s.source_id = d.source_id
LEFT JOIN document_chunk ch ON ch.document_id = d.document_id
WHERE s.source_name = 'WikiStock seed PDF';

SELECT count(*) AS orphan_citations
FROM citation ci
LEFT JOIN document_chunk ch ON ch.chunk_id = ci.chunk_id
WHERE ch.chunk_id IS NULL;
```

The expected invariant values are `documents = 12`, `ready = 12`,
`duplicate_checksums = 0`, `invalid_embeddings = 0`, and
`orphan_citations = 0`. Each document must also have equal, non-zero chunk and
citation counts.

## RAG retrieval (R5)

`app.retrieval.retrieve_evidence()` embeds one normalized question with the
same `BAAI/bge-m3` model used during ingestion, then runs an exact pgvector
cosine search. Company, fiscal year, document type, `ready` status, and
non-null embedding filters are applied in SQL before `LIMIT`.

```python
from app.retrieval import retrieve_evidence

result = retrieve_evidence(
    "Doanh thu quý 1 năm 2026 của FPT là bao nhiêu?",
    "FPT",
    fiscal_year=2026,
    document_types=("financial_statement",),
)

print(result.is_confident)
for chunk in result.evidence:
    print(chunk.chunk_id, chunk.document_id, chunk.page_number, chunk.similarity)
```

The default result contains at most five chunks with cosine similarity at or
above `0.35`, sorted from highest to lowest. If none passes the threshold,
`is_confident` is false and `evidence` is empty. Retrieval has no provider
dependency, so this path cannot call the language model; R6 owns generation.

## R6 grounded answer generation

Set `AI_PROVIDER=gateway` to enable retrieval followed by AI generation. The
default `AI_PROVIDER=demo` is deliberately non-confident and never calls the
database or gateway. A gateway failure is returned as a stable error; it is
never hidden by a demo fallback.

The model receives canonical chunk headers and untrusted source text. Its JSON
output is strictly validated, including the rule that every selected chunk ID
must belong to the retrieved context. The internal endpoint returns only
`chunkId` and `documentId`; R7 will resolve public citation metadata from the
database.

Run the normal suite without a provider key:

```bash
python -m unittest discover -s tests -v
```

Live smoke tests are isolated behind an explicit marker and read the key only
from the process environment:

```bash
export RUN_LIVE_AI_TESTS=1
read -rsp 'AI API key: ' AI_API_KEY && echo
python -m unittest tests.test_live_ai -v
unset RUN_LIVE_AI_TESTS AI_API_KEY
```

Legacy `CLAUDE_*` environment names remain accepted for existing local setups,
but new configuration should use the provider-neutral `AI_*` names above.

| Variable | Default |
|---|---:|
| `RETRIEVAL_TOP_K` | `5` |
| `RETRIEVAL_MIN_SIMILARITY` | `0.35` |

Run the filter-isolation and exact-search integration gate against PostgreSQL
with pgvector:

```bash
TEST_DATABASE_URL='postgresql://app_user:app_password@localhost:5432/app_db' \
  python -m unittest tests.test_retrieval -v
```

The integration test covers company, year, document type, ingestion status,
top-k ordering, and a 30-query p95 ceiling of 300 ms. R5 deliberately uses an
exact scan: the seed set has only 930 chunks, so HNSW, hybrid search, and a
reranker remain out of scope until measurements justify them.

Local acceptance on 2026-08-15 used all 930 OCR-backed chunks with PostgreSQL
18 and pgvector 0.8.6. An FPT Q1/2026 revenue question returned five FPT 2026
chunks; the two highest-ranked chunks were both on page 8 with similarities
`0.7364` and `0.7164`. Across 100 exact SQL searches, p95 was `141.10 ms`.
