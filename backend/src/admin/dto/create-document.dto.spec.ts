/// <reference types="jest" />

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

describe('CreateDocumentDto', () => {
  const requiredFields = {
    sourceId: 1,
    docTypeId: 1,
    title: 'Local annual report',
  };

  it('allows a local document with fileRef and no public URL', async () => {
    const dto = plainToInstance(CreateDocumentDto, {
      ...requiredFields,
      fileRef: 'FPT/report.pdf',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('still rejects a malformed URL when one is provided', async () => {
    const dto = plainToInstance(CreateDocumentDto, {
      ...requiredFields,
      url: 'not-a-url',
    });

    await expect(validate(dto)).resolves.not.toEqual([]);
  });
});
