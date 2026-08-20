import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CitationsModule } from './citations/citations.module';
import { CompaniesModule } from './companies/companies.module';
import { DocumentsModule } from './documents/documents.module';
import { FinancialsModule } from './financials/financials.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { ApiExceptionFilter } from './common/api-exception.filter';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    CompaniesModule,
    FinancialsModule,
    DocumentsModule,
    CitationsModule,
    AiModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
