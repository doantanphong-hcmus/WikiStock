import { defineConfig } from 'prisma/config';

// Load dotenv for local development only
try {
  require('dotenv/config');
} catch {
  // dotenv not available, use environment variables directly
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://app_user:app_password@postgres:5432/app_db',
  },
});
