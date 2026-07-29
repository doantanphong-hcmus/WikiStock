import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse, CompanyProfile } from '../common/types/api.types';
import { findMockCompany, mockCompanies } from '../common/mock-data/companies';

@Injectable()
export class CompaniesService {
  listCompanies(): ApiResponse<CompanyProfile[]> {
    return {
      statusCode: 200,
      message: 'Fetched companies',
      data: mockCompanies,
      error: null,
    };
  }

  findByCompanyCode(ticker: string): ApiResponse<CompanyProfile> {
    const company = findMockCompany(ticker);

    if (!company) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Company not found',
        data: null,
        error: {
          code: 'COMPANY_NOT_FOUND',
          details: `Company ${ticker} is not available in mock data`,
        },
      });
    }

    return {
      statusCode: 200,
      message: 'Fetched company profile',
      data: company,
      error: null,
    };
  }

  findByTicker(ticker: string): ApiResponse<CompanyProfile> {
    return this.findByCompanyCode(ticker);
  }
}
