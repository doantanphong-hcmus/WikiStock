import 'dotenv/config';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    // Support both DATABASE_URL and individual DB_* variables
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      const host = process.env.DB_HOST || 'localhost';
      const port = process.env.DB_PORT || '5432';
      const user = process.env.DB_USER || 'app_user';
      const password = process.env.DB_PASSWORD || 'app_password';
      const dbName = process.env.DB_NAME || 'app_db';
      connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
    }

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
