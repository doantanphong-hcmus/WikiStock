import { Injectable } from '@nestjs/common';
import { ApiResponse, Citation } from '../common/types/api.types';
import { mockCitations } from '../common/mock-data/companies';

@Injectable()
export class CitationsService {
  getCitations(companyCode: string): ApiResponse<Citation[]> {
    const normalizedCompanyCode = companyCode.toUpperCase();

    return {
      statusCode: 200,
      message: 'Fetched citations',
      data: mockCitations[normalizedCompanyCode] ?? [],
      error: null,
    };
  }
}
