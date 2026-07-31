# WikiStock Backend

NestJS API gateway for the WikiStock MVP skeleton.

## Local Setup

```bash
npm install
npm run start:dev
```

Create `.env` from `.env.example` when running locally.

Generate the Prisma client and apply the schema to a new local database:

```bash
npm exec prisma generate
npm exec prisma db push
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
