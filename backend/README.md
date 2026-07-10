# WikiStock Backend

NestJS API gateway for the WikiStock MVP skeleton.

## Local Setup

```bash
npm install
npm run start:dev
```

Create `.env` from `.env.example` when running locally.

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
- `GET /api/v1/admin/companies`

Compatibility routes without `/v1` are kept for the MVP scaffold where useful.
