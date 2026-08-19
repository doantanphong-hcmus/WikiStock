/// <reference types="jest" />

import { PrismaService } from '../database/prisma.service';
import { CitationsService } from './citations.service';

describe('CitationsService', () => {
  const findMany = jest.fn();
  const prisma = { citation: { findMany } } as unknown as PrismaService;
  const service = new CitationsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('trả metadata canonical của đúng doanh nghiệp từ database', async () => {
    findMany.mockResolvedValue([
      {
        citationId: 1,
        documentId: 8,
        locationRef: 'Trang 24',
        excerpt: 'Trích đoạn trong cơ sở dữ liệu.',
        document: {
          documentId: 8,
          title: 'Báo cáo FPT local',
          url: null,
          fileRef: 'FPT/report.pdf',
        },
      },
      {
        citationId: 2,
        documentId: 9,
        locationRef: null,
        excerpt: null,
        document: {
          documentId: 9,
          title: 'Báo cáo FPT remote',
          url: 'https://example.com/fpt.pdf',
          fileRef: null,
        },
      },
      {
        citationId: 3,
        documentId: 10,
        locationRef: 'Trang 1',
        excerpt: 'Không có nguồn để công khai.',
        document: {
          documentId: 10,
          title: 'Tài liệu thiếu nguồn',
          url: null,
          fileRef: null,
        },
      },
    ]);

    const result = await service.getCitations(' fpt ');

    type CitationQuery = {
      where: {
        document: {
          ingestionStatus: string;
          company: { ticker: string };
        };
      };
    };
    const calls = findMany.mock.calls as unknown as Array<[CitationQuery]>;
    expect(calls[0][0].where).toEqual({
      document: {
        ingestionStatus: 'ready',
        company: { ticker: 'FPT' },
      },
    });
    expect(result.data).toEqual([
      {
        citationId: 1,
        documentId: 8,
        docTitle: 'Báo cáo FPT local',
        sourceUrl: '/api/v1/documents/8/file',
        locationRef: 'Trang 24',
        excerpt: 'Trích đoạn trong cơ sở dữ liệu.',
      },
      {
        citationId: 2,
        documentId: 9,
        docTitle: 'Báo cáo FPT remote',
        sourceUrl: 'https://example.com/fpt.pdf',
        locationRef: null,
        excerpt: null,
      },
    ]);
  });

  it('trả danh sách rỗng khi doanh nghiệp chưa có trích dẫn', async () => {
    findMany.mockResolvedValue([]);

    const result = await service.getCitations('FPT');

    expect(result.data).toEqual([]);
  });
});
