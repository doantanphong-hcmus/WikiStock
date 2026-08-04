# WikiStock AI Service

## Claude provider contract

R2 targets the Zunef Claude proxy. The API key must only exist in a local
`.env` file or a secret store; never put it in a command, fixture, log, or Git.

| Item | Contract |
|---|---|
| Base URL | `https://claude.zunef.com/v1/ai` |
| List models | `GET /models` |
| Create message | `POST /messages` |
| Authentication | `x-api-key: $CLAUDE_API_KEY` |
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
export CLAUDE_API_BASE_URL='https://claude.zunef.com/v1/ai'
read -rsp 'Claude API key: ' CLAUDE_API_KEY && echo

curl --silent --show-error --fail-with-body \
  --connect-timeout 5 --max-time 45 \
  -H "x-api-key: $CLAUDE_API_KEY" \
  "$CLAUDE_API_BASE_URL/models"

export CLAUDE_MODEL='claude-sonnet-4-6'
CLAUDE_REQUEST_BODY=$(printf '%s' \
  "{\"model\":\"$CLAUDE_MODEL\",\"max_tokens\":32,\"temperature\":0,\"messages\":[{\"role\":\"user\",\"content\":\"Reply with only: pong\"}]}")
curl --silent --show-error --fail-with-body \
  --connect-timeout 5 --max-time 45 \
  -H 'content-type: application/json' \
  -H 'anthropic-version: 2023-06-01' \
  -H "x-api-key: $CLAUDE_API_KEY" \
  "$CLAUDE_API_BASE_URL/messages" \
  --data "$CLAUDE_REQUEST_BODY"

unset CLAUDE_API_KEY CLAUDE_REQUEST_BODY
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
  -e TEST_DATABASE_URL='postgresql://wikistock:wikistock@postgres:5432/wikistock' \
  ai-service python -m unittest discover -s tests
```

Acceptance query:

```bash
docker compose exec -T postgres psql -U wikistock -d wikistock -c "
SELECT d.file_ref, d.ingestion_status, d.embedding_model, d.chunk_version,
       count(DISTINCT ch.chunk_id) AS chunks,
       count(DISTINCT ci.citation_id) AS citations
FROM source_document d
LEFT JOIN document_chunk ch ON ch.document_id = d.document_id
LEFT JOIN citation ci ON ci.document_id = d.document_id
GROUP BY d.document_id
ORDER BY d.file_ref;"
```
