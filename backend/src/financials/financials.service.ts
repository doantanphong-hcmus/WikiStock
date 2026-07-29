import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse, FinancialSummary } from '../common/types/api.types';
import { mockFinancials } from '../common/mock-data/companies';

@Injectable()
export class FinancialsService {
  getFinancials(
    companyCode: string,
    year?: string,
    quarter?: string,
  ): ApiResponse<FinancialSummary> {
    const normalizedCompanyCode = companyCode.toUpperCase();
    const financial = mockFinancials[normalizedCompanyCode];

    if (!financial) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Financials not found',
        data: null,
        error: {
          code: 'FINANCIALS_NOT_FOUND',
          details: `Company ${companyCode} has no mock financial data`,
        },
      });
    }

    return {
      statusCode: 200,
      message: 'Fetched financial data',
      data: financial,
      error: null,
    };
  }
}
