# WikiStock Backend

NestJS API gateway for the WikiStock MVP skeleton.

## Database ownership

`backend/prisma/migrations` is the only executable history for creating and
upgrading the database. The crawler and AI service consume this schema; they do
not create their own tables.

PostgreSQL must have the pgvector extension installed on the server. The
baseline migration enables it and creates `document_chunk.embedding` as
`vector(1024)`.

## Local Setup

Create `backend/.env` from `backend/.env.example`, then run:

```bash
npm ci
npm exec prisma generate
npm run db:bootstrap
npm run start:dev
```

`db:bootstrap` applies pending migrations, seeds stable V1 lookups, and checks
pgvector, core tables, the embedding dimension, and the chunk uniqueness rule.
It is safe to run again: applied migrations are skipped and seed records are
upserted.

Individual commands are also available:

```bash
npm run db:migrate
npm run db:seed
npm run db:check
```

Kiểm thử lát cắt Backend bằng PostgreSQL test riêng:

```powershell
$env:TEST_DATABASE_URL="postgresql://app_user:app_password@localhost:55432/wikistock_e2e"
npm run test:e2e:real-data
```

Quy trình đầy đủ và smoke test live được ghi tại
[`docs/BACKEND_REAL_DATA_E2E.md`](../docs/BACKEND_REAL_DATA_E2E.md).

Cấu hình bắt buộc, health check, error envelope và giới hạn request được mô tả tại
[`docs/BACKEND_OPERATIONS.md`](../docs/BACKEND_OPERATIONS.md).

Quy trình dựng toàn bộ hệ thống bằng Docker hoặc native Windows, tạo Admin, backup,
restore và demo được ghi tại
[`docs/BACKEND_V1_RUNBOOK.md`](../docs/BACKEND_V1_RUNBOOK.md).

Do not use `prisma db push` for WikiStock databases. It does not own the custom
pgvector column or the database-only validation constraints.

### Existing database created from the old `schema.sql`

Do not run the baseline migration directly against a populated legacy database.
Back it up, run `npm run db:check`, compare it with the baseline migration, and
only then mark `20260816000000_baseline` as applied with `prisma migrate resolve`.
For disposable local data, creating a fresh database is safer.

```bash
npm exec prisma migrate resolve --applied 20260816000000_baseline
```

Set `JWT_SECRET` to at least 32 random characters. Create the first Admin after
the database schema is available:

```powershell
$env:ADMIN_EMAIL="admin@wikistock.vn"
$env:ADMIN_PASSWORD="replace-with-a-strong-password"
$env:ADMIN_FULL_NAME="WikiStock Admin"
npm run admin:create
```

## Local Development Ports

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/health
- Backend API v1: http://localhost:3001/api/v1
- AI service: http://localhost:8000

## Implemented Endpoints

- `GET /api/health`
- `GET /api/v1/companies`
- `GET /api/v1/companies/:companyCode/profile`
- `GET /api/v1/companies/:companyCode/financials`
- `GET /api/v1/companies/:companyCode/documents`
- `GET /api/v1/companies/:companyCode/citations`
- `POST /api/v1/ai/ask`
- `POST /api/v1/auth/login`
- `GET /api/v1/admin/companies`
- `GET /api/v1/admin/documents`
- `GET /api/v1/admin/document-options`
- `POST /api/v1/admin/documents`
- `PATCH /api/v1/admin/documents/:documentId/review`
- `POST /api/v1/admin/citations/check`
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/roles`
- `PATCH /api/v1/admin/users/:userId/role`

All `/api/v1/admin/*` endpoints require a valid Admin bearer token.

Compatibility routes without `/v1` are kept for the MVP scaffold where useful.
