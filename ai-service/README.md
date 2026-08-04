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
