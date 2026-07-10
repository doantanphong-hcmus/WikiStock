import { Injectable } from '@nestjs/common';
import { ApiResponse, DocumentSummary } from '../common/types/api.types';
import { mockDocuments } from '../common/mock-data/companies';

@Injectable()
export class DocumentsService {
  getDocuments(companyCode: string): ApiResponse<DocumentSummary[]> {
    const normalizedCompanyCode = companyCode.toUpperCase();

    return {
      statusCode: 200,
      message: 'Fetched documents',
      data: mockDocuments[normalizedCompanyCode] ?? [],
      error: null,
    };
  }
}
