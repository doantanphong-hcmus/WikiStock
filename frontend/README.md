# WikiStock Frontend

Next.js App Router skeleton for the WikiStock MVP.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` when you need to override the backend URL.

## Local Development Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Backend API v1: http://localhost:3001/api/v1
- AI service: http://localhost:8000

## Routes

- `/`
- `/search`
- `/companies/FPT`
- `/companies/FPT/financials`
- `/companies/FPT/ai`
- `/companies/FPT/risk`
- `/admin`
- `/login`

Frontend calls the backend through `NEXT_PUBLIC_API_BASE_URL`; it does not call ai-service directly.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
