/// <reference types="jest" />

import { StreamableFile } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  it('serves a registered document inline as application/pdf', async () => {
    const service = {
      getRegisteredPdf: jest.fn().mockResolvedValue({
        path: __filename,
        filename: 'Báo cáo FPT.pdf',
      }),
    };
    const controller = new DocumentsController(
      service as unknown as DocumentsService,
    );

    const response = await controller.getDocumentFile(8);

    expect(response).toBeInstanceOf(StreamableFile);
    expect(response.getHeaders()).toMatchObject({
      type: 'application/pdf',
      disposition: expect.stringContaining('inline;'),
    });
  });
});
