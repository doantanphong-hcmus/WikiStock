/// <reference types="jest" />

import { PrismaService } from '../database/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('reports invalid source URLs separately from citation warnings', async () => {
    const prisma = {
      citation: {
        findMany: jest.fn().mockResolvedValue([
          {
            citationId: 1,
            excerpt: null,
            locationRef: null,
            document: {
              documentId: 10,
              title: 'Annual report',
              url: 'not-a-url',
              fileRef: null,
            },
          },
          {
            citationId: 2,
            excerpt: 'Revenue increased.',
            locationRef: 'Page 12',
            document: {
              documentId: 11,
              title: 'Financial statement',
              url: 'https://example.com/report.pdf',
              fileRef: null,
            },
          },
          {
            citationId: 3,
            excerpt: 'Net revenue increased.',
            locationRef: 'Page 8',
            document: {
              documentId: 12,
              title: 'Local financial statement',
              url: null,
              fileRef: 'seed_data/FPT/report.pdf',
            },
          },
        ]),
      },
    };
    const service = new AdminService(prisma as unknown as PrismaService);

    const result = await service.runCitationCheck();

    expect(result.data).toMatchObject({
      totalCitations: 3,
      validCitations: 2,
      invalidCitations: 1,
      warnings: 2,
    });
  });
});
