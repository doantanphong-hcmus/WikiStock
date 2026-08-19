/// <reference types="jest" />

import { NotFoundException } from '@nestjs/common';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const findCompany = jest.fn();
  const findDocument = jest.fn();
  const prisma = {
    company: { findUnique: findCompany },
    sourceDocument: { findUnique: findDocument },
  };
  const service = new DocumentsService(prisma as unknown as PrismaService);
  const originalSeedPath = process.env.SEED_DATA_PATH;
  let workspace: string;
  let seedRoot: string;

  beforeEach(async () => {
    findCompany.mockReset();
    findDocument.mockReset();
    workspace = await mkdtemp(join(tmpdir(), 'wikistock-documents-'));
    seedRoot = join(workspace, 'seed');
    await mkdir(seedRoot);
    process.env.SEED_DATA_PATH = seedRoot;
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  afterAll(() => {
    if (originalSeedPath === undefined) {
      delete process.env.SEED_DATA_PATH;
    } else {
      process.env.SEED_DATA_PATH = originalSeedPath;
    }
  });

  function register(fileRef: string, ingestionStatus = 'ready') {
    findDocument.mockResolvedValue({
      documentId: 8,
      title: 'FPT annual report',
      fileRef,
      ingestionStatus,
    });
  }

  it('trả tài liệu ready của đúng doanh nghiệp từ database', async () => {
    findCompany.mockResolvedValue({
      sourceDocuments: [
        {
          documentId: 8,
          companyId: 1,
          title: 'Báo cáo FPT local',
          publishedDate: new Date('2026-06-30T00:00:00.000Z'),
          url: null,
          fileRef: 'FPT/report.pdf',
          crawledAt: new Date('2026-08-18T10:00:00.000Z'),
          checksum: 'abc',
          source: {
            sourceId: 1,
            sourceName: 'WikiStock seed PDF',
            sourceType: 'document',
            reliabilityTier: 1,
            costTier: 'free',
            accessUrl: null,
          },
          documentType: { docTypeId: 1, typeName: 'financial_statement' },
        },
        {
          documentId: 7,
          companyId: 1,
          title: 'Báo cáo FPT remote',
          publishedDate: null,
          url: 'https://example.com/fpt.pdf',
          fileRef: null,
          crawledAt: new Date('2026-08-17T10:00:00.000Z'),
          checksum: null,
          source: {
            sourceId: 2,
            sourceName: 'Remote source',
            sourceType: 'document',
            reliabilityTier: 2,
            costTier: 'free',
            accessUrl: 'https://example.com',
          },
          documentType: { docTypeId: 2, typeName: 'annual_report' },
        },
      ],
    });

    const result = await service.getDocuments(' fpt ');

    type CompanyQuery = {
      where: { ticker: string };
      select: { sourceDocuments: { where: { ingestionStatus: string } } };
    };
    const calls = findCompany.mock.calls as unknown as Array<[CompanyQuery]>;
    const query = calls[0][0];
    expect(query.where).toEqual({ ticker: 'FPT' });
    expect(query.select.sourceDocuments.where).toEqual({
      ingestionStatus: 'ready',
    });
    expect(result.data).toEqual([
      expect.objectContaining({
        documentId: 8,
        publishedDate: '2026-06-30',
        url: '/api/v1/documents/8/file',
        crawledAt: '2026-08-18T10:00:00.000Z',
      }),
      expect.objectContaining({
        documentId: 7,
        url: 'https://example.com/fpt.pdf',
      }),
    ]);
  });

  it('trả danh sách rỗng khi doanh nghiệp chưa có tài liệu', async () => {
    findCompany.mockResolvedValue({ sourceDocuments: [] });

    const result = await service.getDocuments('FPT');

    expect(result.data).toEqual([]);
  });

  it('returns a registered ready PDF under the configured seed root', async () => {
    const companyDirectory = join(seedRoot, 'FPT');
    await mkdir(companyDirectory);
    const pdfPath = join(companyDirectory, 'report.pdf');
    await writeFile(pdfPath, '%PDF-test');
    register('FPT/report.pdf');

    await expect(service.getRegisteredPdf(8)).resolves.toEqual({
      path: pdfPath,
      filename: 'FPT annual report.pdf',
    });
  });

  it('rejects path traversal and non-ready documents', async () => {
    const outside = join(workspace, 'outside.pdf');
    await writeFile(outside, '%PDF-test');
    register('../outside.pdf');
    await expect(service.getRegisteredPdf(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    register('FPT/report.pdf', 'pending');
    await expect(service.getRegisteredPdf(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a symlink that escapes the configured seed root', async () => {
    const outsideDirectory = join(workspace, 'outside');
    await mkdir(outsideDirectory);
    await writeFile(join(outsideDirectory, 'report.pdf'), '%PDF-test');
    const link = join(seedRoot, 'linked');
    try {
      await symlink(outsideDirectory, link, 'junction');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        return;
      }
      throw error;
    }
    register('linked/report.pdf');

    await expect(service.getRegisteredPdf(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
