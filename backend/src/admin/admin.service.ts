import { Injectable } from '@nestjs/common';
import { ApiResponse, AdminCompanyStatus } from '../common/types/api.types';
import { mockCompanies } from '../common/mock-data/companies';

@Injectable()
export class AdminService {
  listCompanies(): ApiResponse<AdminCompanyStatus[]> {
    return {
      statusCode: 200,
      message: 'Fetched admin company status',
      data: mockCompanies.map((company) => ({
        companyId: company.companyId,
        ticker: company.ticker,
        companyName: company.companyName,
        dataStatus: company.ticker === 'FPT' ? 'ready' : 'draft',
        sourceStatus: 'mock',
        lastUpdated: '2026-07-09',
      })),
      error: null,
    };
  }
}
