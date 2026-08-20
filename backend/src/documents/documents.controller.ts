import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
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

  @Get('v1/documents/:documentId/file')
  async getDocumentFile(
    @Param('documentId', ParseIntPipe) documentId: number,
  ): Promise<StreamableFile> {
    const file = await this.documentsService.getRegisteredPdf(documentId);
    const fallbackName = `document-${documentId}.pdf`;
    const encodedName = encodeURIComponent(
      file.filename.replace(/[\\/\0\r\n]/g, ' ').trim() || fallbackName,
    );
    return new StreamableFile(createReadStream(file.path), {
      type: 'application/pdf',
      disposition: `inline; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,
    });
  }
}
