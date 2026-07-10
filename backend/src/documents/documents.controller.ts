import { Controller, Get, Param } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get([
    'v1/companies/:companyCode/documents',
    'companies/:companyCode/documents',
  ])
  getDocuments(@Param('companyCode') companyCode: string) {
    return this.documentsService.getDocuments(companyCode);
  }
}
