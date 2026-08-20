import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  AiAskResponse,
  ApiResponse,
  Citation,
  DocumentSummary,
} from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithDatabase('R7 citations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let seedRoot: string;
  let documentId: number;
  let chunkId: number;
  let citationId: number;
  let companyId: number;
  let sourceId: number;
  let docTypeId: number;
  let exchangeId: number;
  let industryId: number;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSeedPath = process.env.SEED_DATA_PATH;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'r7-e2e-test-secret';
    seedRoot = await mkdtemp(join(tmpdir(), 'wikistock-r7-e2e-'));
    process.env.SEED_DATA_PATH = seedRoot;
    await mkdir(join(seedRoot, 'FPT'));
    await writeFile(join(seedRoot, 'FPT', 'report.pdf'), '%PDF-1.4\n%%EOF');

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = Date.now().toString().slice(-6);
    const exchange = await prisma.exchange.create({
      data: { exchangeCode: `R7${suffix}`, exchangeName: 'R7 Test Exchange' },
    });
    exchangeId = exchange.exchangeId;
    const industry = await prisma.industry.create({
      data: { industryCode: `R7${suffix}`, industryName: 'R7 Test Industry' },
    });
    industryId = industry.industryId;
    const company = await prisma.company.create({
      data: {
        ticker: 'R7TEST',
        companyName: 'R7 Test Company',
        exchangeId,
        industryId,
      },
    });
    companyId = company.companyId;
    const source = await prisma.dataSource.create({
      data: {
        sourceName: `R7 Test Source ${suffix}`,
        sourceType: 'internal',
        reliabilityTier: 3,
        costTier: 'free',
      },
    });
    sourceId = source.sourceId;
    const documentType = await prisma.documentType.create({
      data: { typeName: `r7_test_${suffix}` },
    });
    docTypeId = documentType.docTypeId;
    const document = await prisma.sourceDocument.create({
      data: {
        companyId,
        sourceId,
        docTypeId,
        title: 'R7 Canonical Report',
        fileRef: 'FPT/report.pdf',
        ingestionStatus: 'ready',
      },
    });
    documentId = document.documentId;
    const chunk = await prisma.documentChunk.create({
      data: {
        documentId,
        chunkIndex: 0,
        pageNumber: 12,
        locationRef: 'Trang 12',
        content: 'Canonical database evidence.',
        charCount: 28,
        contentHash: 'a'.repeat(64),
      },
    });
    chunkId = chunk.chunkId;
    const citation = await prisma.citation.create({
      data: {
        documentId,
        chunkId,
        locationRef: 'Trang 12',
        excerpt: 'Canonical database evidence.',
      },
    });
    citationId = citation.citationId;
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (prisma) {
      await prisma.citation.deleteMany({ where: { citationId } });
      await prisma.sourceDocument.deleteMany({ where: { documentId } });
      await prisma.company.deleteMany({ where: { companyId } });
      await prisma.dataSource.deleteMany({ where: { sourceId } });
      await prisma.documentType.deleteMany({ where: { docTypeId } });
      await prisma.exchange.deleteMany({ where: { exchangeId } });
      await prisma.industry.deleteMany({ where: { industryId } });
    }
    await app?.close();
    await rm(seedRoot, { recursive: true, force: true });
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalSeedPath === undefined) delete process.env.SEED_DATA_PATH;
    else process.env.SEED_DATA_PATH = originalSeedPath;
  });

  it('returns a DB-backed citation whose source URL serves the registered PDF', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          statusCode: 200,
          message: 'AI Generated Answer Successfully',
          data: {
            answer: 'Grounded answer.',
            isConfident: true,
            limitations: null,
            evidence: [{ chunkId, documentId }],
          },
          error: null,
        }),
    } as Response);

    const answer = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .send({ query: 'Question', companyCode: 'R7TEST' })
      .expect(200);
    const answerBody = answer.body as unknown as ApiResponse<AiAskResponse>;

    expect(answerBody.data?.citations).toEqual([
      {
        citationId,
        documentId,
        docTitle: 'R7 Canonical Report',
        sourceUrl: `/api/v1/documents/${documentId}/file`,
        locationRef: 'Trang 12',
        excerpt: 'Canonical database evidence.',
      },
    ]);
    const sourceUrl = answerBody.data?.citations[0]?.sourceUrl;
    if (!sourceUrl) {
      throw new Error('AI answer did not include a citation source URL');
    }

    await request(app.getHttpServer())
      .get(sourceUrl)
      .expect('Content-Type', /application\/pdf/)
      .expect('Content-Disposition', /inline/)
      .expect(200);
  });

  it('serves DB-backed public documents and citations for the company', async () => {
    const documentsResponse = await request(app.getHttpServer())
      .get('/api/v1/companies/r7test/documents')
      .expect(200);
    const documents = documentsResponse.body as ApiResponse<DocumentSummary[]>;
    expect(documents.data).toEqual([
      expect.objectContaining({
        documentId,
        title: 'R7 Canonical Report',
        url: `/api/v1/documents/${documentId}/file`,
      }),
    ]);

    const citationsResponse = await request(app.getHttpServer())
      .get('/api/v1/companies/r7test/citations')
      .expect(200);
    const citations = citationsResponse.body as ApiResponse<Citation[]>;
    expect(citations.data).toEqual([
      {
        citationId,
        documentId,
        docTitle: 'R7 Canonical Report',
        sourceUrl: `/api/v1/documents/${documentId}/file`,
        locationRef: 'Trang 12',
        excerpt: 'Canonical database evidence.',
      },
    ]);
  });
});
