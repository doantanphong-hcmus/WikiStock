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
        companyCode: company.companyCode,
        ticker: company.ticker,
        name: company.name,
        dataStatus: company.companyCode === 'FPT' ? 'ready' : 'draft',
        sourceStatus: 'mock',
        lastUpdated: '2026-07-09',
      })),
      error: null,
    };
  }
}
