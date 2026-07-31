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
            },
          },
        ]),
      },
    };
    const service = new AdminService(prisma as unknown as PrismaService);

    const result = await service.runCitationCheck();

    expect(result.data).toMatchObject({
      totalCitations: 2,
      validCitations: 1,
      invalidCitations: 1,
      warnings: 2,
    });
  });
});
