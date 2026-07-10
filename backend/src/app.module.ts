import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { CitationsModule } from './citations/citations.module';
import { CompaniesModule } from './companies/companies.module';
import { DocumentsModule } from './documents/documents.module';
import { FinancialsModule } from './financials/financials.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    HealthModule,
    CompaniesModule,
    FinancialsModule,
    DocumentsModule,
    CitationsModule,
    AiModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
