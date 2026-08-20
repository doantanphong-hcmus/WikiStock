import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  AiAskResponse,
  ApiResponse,
  CompanyProfile,
  DocumentSummary,
  FinancialSummary,
} from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

const demoTickers = [
  'FPT',
  'GAS',
  'HPG',
  'HSG',
  'MWG',
  'SSI',
  'VCB',
  'VCG',
  'VIC',
  'VNM',
] as const;

describeWithDatabase('Backend real-data vertical slice (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let seedRoot: string;
  let outsidePdf: string;
  let fptCompanyId: number;
  let hpgCompanyId: number;
  let readyDocumentId: number;
  let pendingDocumentId: number;
  let outsideDocumentId: number;
  let foreignDocumentId: number;
  let readyChunkId: number;
  let foreignChunkId: number;
  let readyCitationId: number;
  const createdCompanyIds: number[] = [];
  const reportIds: number[] = [];
  const documentIds: number[] = [];
  const citationIds: number[] = [];
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSeedPath = process.env.SEED_DATA_PATH;
  const originalAiDemoMode = process.env.AI_DEMO_MODE;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.AI_DEMO_MODE = 'false';
    seedRoot = await mkdtemp(join(tmpdir(), 'wikistock-b6-e2e-'));
    outsidePdf = join(dirname(seedRoot), `${basename(seedRoot)}-outside.pdf`);
    process.env.SEED_DATA_PATH = seedRoot;
    await mkdir(join(seedRoot, 'FPT'));
    await mkdir(join(seedRoot, 'HPG'));
    await writeFile(
      join(seedRoot, 'FPT', 'annual-report.pdf'),
      '%PDF-1.4\n%%EOF',
    );
    await writeFile(join(seedRoot, 'FPT', 'pending.pdf'), '%PDF-1.4\n%%EOF');
    await writeFile(
      join(seedRoot, 'HPG', 'annual-report.pdf'),
      '%PDF-1.4\n%%EOF',
    );
    await writeFile(outsidePdf, '%PDF-1.4\n%%EOF');

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidUnknownValues: false,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const seededCompanies = await prisma.company.findMany({
      where: { ticker: { in: [...demoTickers] } },
      select: { companyId: true, ticker: true },
    });
    const companiesByTicker = new Map(
      seededCompanies.map((company) => [company.ticker, company.companyId]),
    );
    const exchange = await prisma.exchange.findUniqueOrThrow({
      where: { exchangeCode: 'HOSE' },
    });
    const industry = await prisma.industry.findUniqueOrThrow({
      where: { industryCode: 'TECH' },
    });

    // Fixture dùng đúng 10 mã mà crawler demo xử lý; chỉ bổ sung mã seed còn thiếu.
    for (const ticker of demoTickers) {
      if (companiesByTicker.has(ticker)) continue;
      const company = await prisma.company.create({
        data: {
          ticker,
          companyName: `${ticker} E2E Company`,
          exchangeId: exchange.exchangeId,
          industryId: industry.industryId,
        },
      });
      companiesByTicker.set(ticker, company.companyId);
      createdCompanyIds.push(company.companyId);
    }

    fptCompanyId = companiesByTicker.get('FPT')!;
    hpgCompanyId = companiesByTicker.get('HPG')!;
    const source = await prisma.dataSource.findUniqueOrThrow({
      where: { sourceName: 'WikiStock seed PDF' },
    });
    const documentType = await prisma.documentType.findUniqueOrThrow({
      where: { typeName: 'annual_report' },
    });
    const revenue = await prisma.metric.findUniqueOrThrow({
      where: { metricCode: 'REVENUE' },
    });
    const netProfit = await prisma.metric.findUniqueOrThrow({
      where: { metricCode: 'NET_PROFIT' },
    });

    const previousReport = await prisma.financialReport.create({
      data: {
        companyId: fptCompanyId,
        periodType: 'Q',
        fiscalYear: 2025,
        fiscalQuarter: 4,
        reportDate: new Date('2025-12-31T00:00:00.000Z'),
      },
    });
    const latestReport = await prisma.financialReport.create({
      data: {
        companyId: fptCompanyId,
        periodType: 'Q',
        fiscalYear: 2026,
        fiscalQuarter: 1,
        reportDate: new Date('2026-03-31T00:00:00.000Z'),
      },
    });
    reportIds.push(previousReport.reportId, latestReport.reportId);
    await prisma.financialLineItem.createMany({
      data: [
        {
          reportId: previousReport.reportId,
          metricId: revenue.metricId,
          value: '16800000000000.0000',
        },
        {
          reportId: latestReport.reportId,
          metricId: revenue.metricId,
          value: '17600000000000.0000',
        },
        {
          reportId: latestReport.reportId,
          metricId: netProfit.metricId,
          value: '3200000000000.0000',
        },
      ],
    });

    const [readyDocument, pendingDocument, outsideDocument, foreignDocument] =
      await Promise.all([
        prisma.sourceDocument.create({
          data: {
            companyId: fptCompanyId,
            sourceId: source.sourceId,
            docTypeId: documentType.docTypeId,
            title: 'Báo cáo thường niên FPT 2025',
            fiscalYear: 2025,
            fileRef: 'FPT/annual-report.pdf',
            checksum: '1'.repeat(64),
            ingestionStatus: 'ready',
          },
        }),
        prisma.sourceDocument.create({
          data: {
            companyId: fptCompanyId,
            sourceId: source.sourceId,
            docTypeId: documentType.docTypeId,
            title: 'Tài liệu FPT đang xử lý',
            fileRef: 'FPT/pending.pdf',
            checksum: '2'.repeat(64),
            ingestionStatus: 'pending',
          },
        }),
        prisma.sourceDocument.create({
          data: {
            companyId: fptCompanyId,
            sourceId: source.sourceId,
            docTypeId: documentType.docTypeId,
            title: 'Tài liệu ngoài vùng cho phép',
            fileRef: `../${basename(outsidePdf)}`,
            checksum: '3'.repeat(64),
            ingestionStatus: 'ready',
          },
        }),
        prisma.sourceDocument.create({
          data: {
            companyId: hpgCompanyId,
            sourceId: source.sourceId,
            docTypeId: documentType.docTypeId,
            title: 'Báo cáo thường niên HPG 2025',
            fileRef: 'HPG/annual-report.pdf',
            checksum: '4'.repeat(64),
            ingestionStatus: 'ready',
          },
        }),
      ]);
    readyDocumentId = readyDocument.documentId;
    pendingDocumentId = pendingDocument.documentId;
    outsideDocumentId = outsideDocument.documentId;
    foreignDocumentId = foreignDocument.documentId;
    documentIds.push(
      readyDocumentId,
      pendingDocumentId,
      outsideDocumentId,
      foreignDocumentId,
    );

    const [readyChunk, foreignChunk] = await Promise.all([
      prisma.documentChunk.create({
        data: {
          documentId: readyDocumentId,
          chunkIndex: 0,
          pageNumber: 12,
          locationRef: 'Trang 12',
          content: 'Doanh thu FPT tăng trưởng trong năm 2025.',
          charCount: 44,
          contentHash: 'b'.repeat(64),
        },
      }),
      prisma.documentChunk.create({
        data: {
          documentId: foreignDocumentId,
          chunkIndex: 0,
          pageNumber: 8,
          locationRef: 'Trang 8',
          content: 'Dữ liệu này chỉ thuộc HPG.',
          charCount: 27,
          contentHash: 'c'.repeat(64),
        },
      }),
    ]);
    readyChunkId = readyChunk.chunkId;
    foreignChunkId = foreignChunk.chunkId;
    const [readyCitation, foreignCitation] = await Promise.all([
      prisma.citation.create({
        data: {
          documentId: readyDocumentId,
          chunkId: readyChunkId,
          locationRef: 'Trang 12',
          excerpt: 'Doanh thu FPT tăng trưởng trong năm 2025.',
        },
      }),
      prisma.citation.create({
        data: {
          documentId: foreignDocumentId,
          chunkId: foreignChunkId,
          locationRef: 'Trang 8',
          excerpt: 'Dữ liệu này chỉ thuộc HPG.',
        },
      }),
    ]);
    readyCitationId = readyCitation.citationId;
    citationIds.push(readyCitationId, foreignCitation.citationId);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (prisma) {
      await prisma.citation.deleteMany({
        where: { citationId: { in: citationIds } },
      });
      await prisma.financialLineItem.deleteMany({
        where: { reportId: { in: reportIds } },
      });
      await prisma.financialReport.deleteMany({
        where: { reportId: { in: reportIds } },
      });
      await prisma.sourceDocument.deleteMany({
        where: { documentId: { in: documentIds } },
      });
      if (createdCompanyIds.length) {
        await prisma.company.deleteMany({
          where: { companyId: { in: createdCompanyIds } },
        });
      }
    }
    await app?.close();
    await rm(seedRoot, { recursive: true, force: true });
    await rm(outsidePdf, { force: true });
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalSeedPath === undefined) delete process.env.SEED_DATA_PATH;
    else process.env.SEED_DATA_PATH = originalSeedPath;
    if (originalAiDemoMode === undefined) delete process.env.AI_DEMO_MODE;
    else process.env.AI_DEMO_MODE = originalAiDemoMode;
  });

  afterEach(() => jest.restoreAllMocks());

  it('trả đủ 10 mã demo và hồ sơ FPT từ PostgreSQL', async () => {
    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/companies')
      .expect(200);
    const companies = listResponse.body as ApiResponse<CompanyProfile[]>;
    const tickers = new Set(companies.data?.map((company) => company.ticker));
    expect(demoTickers.every((ticker) => tickers.has(ticker))).toBe(true);

    const profileResponse = await request(app.getHttpServer())
      .get('/api/v1/companies/fpt/profile')
      .expect(200);
    const profile = profileResponse.body as ApiResponse<CompanyProfile>;
    expect(profile.data).toMatchObject({
      ticker: 'FPT',
      companyName: 'FPT Corporation',
      exchange: { exchangeCode: 'HOSE' },
      industry: { industryCode: 'TECH' },
    });
  });

  it('trả kỳ tài chính mới nhất và lọc đúng kỳ cũ', async () => {
    const latestResponse = await request(app.getHttpServer())
      .get('/api/v1/companies/FPT/financials')
      .expect(200);
    const latest = latestResponse.body as ApiResponse<FinancialSummary>;
    expect(latest.data).toMatchObject({
      ticker: 'FPT',
      fiscalYear: 2026,
      fiscalQuarter: 1,
      reportDate: '2026-03-31',
    });
    expect(latest.data?.lineItems).toHaveLength(2);

    const filteredResponse = await request(app.getHttpServer())
      .get('/api/v1/companies/FPT/financials?year=2025&quarter=4')
      .expect(200);
    const filtered = filteredResponse.body as ApiResponse<FinancialSummary>;
    expect(filtered.data).toMatchObject({ fiscalYear: 2025, fiscalQuarter: 4 });
    expect(filtered.data?.lineItems[0].value).toBe('16800000000000');
  });

  it('chỉ liệt kê tài liệu sẵn sàng thuộc FPT', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/companies/FPT/documents')
      .expect(200);
    const body = response.body as ApiResponse<DocumentSummary[]>;
    const ids = body.data?.map((document) => document.documentId) ?? [];

    expect(ids).toContain(readyDocumentId);
    expect(ids).toContain(outsideDocumentId);
    expect(ids).not.toContain(pendingDocumentId);
    expect(ids).not.toContain(foreignDocumentId);
  });

  it('ánh xạ evidence AI sang citation chuẩn và mở được PDF', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            answer: 'FPT có tăng trưởng doanh thu.',
            isConfident: true,
            evidence: [{ chunkId: readyChunkId, documentId: readyDocumentId }],
          },
        }),
    } as Response);

    const answerResponse = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .send({ query: 'Doanh thu FPT thế nào?', companyCode: 'FPT' })
      .expect(200);
    const answer = answerResponse.body as ApiResponse<AiAskResponse>;
    expect(answer.data?.citations).toEqual([
      expect.objectContaining({
        citationId: readyCitationId,
        documentId: readyDocumentId,
        sourceUrl: `/api/v1/documents/${readyDocumentId}/file`,
        locationRef: 'Trang 12',
      }),
    ]);

    await request(app.getHttpServer())
      .get(answer.data!.citations[0].sourceUrl)
      .expect('Content-Type', /application\/pdf/)
      .expect(200);
  });

  it('chặn PDF pending và đường dẫn thoát khỏi thư mục seed', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/documents/${pendingDocumentId}/file`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/api/v1/documents/${outsideDocumentId}/file`)
      .expect(404);
  });

  it('từ chối evidence của doanh nghiệp khác', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            answer: 'Câu trả lời dùng nhầm dữ liệu.',
            isConfident: true,
            evidence: [
              { chunkId: foreignChunkId, documentId: foreignDocumentId },
            ],
          },
        }),
    } as Response);

    const response = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .send({ query: 'Doanh thu FPT thế nào?', companyCode: 'FPT' })
      .expect(502);
    expect(response.body).toMatchObject({
      error: { code: 'AI_INVALID_EVIDENCE' },
    });
  });

  it('trả đúng 404 khi doanh nghiệp hoặc kỳ tài chính không tồn tại', async () => {
    const missingCompany = await request(app.getHttpServer())
      .get('/api/v1/companies/NOTFOUND/profile')
      .expect(404);
    expect(missingCompany.body).toMatchObject({
      error: { code: 'COMPANY_NOT_FOUND' },
    });

    const missingFinancial = await request(app.getHttpServer())
      .get('/api/v1/companies/FPT/financials?year=2024&quarter=4')
      .expect(404);
    expect(missingFinancial.body).toMatchObject({
      error: { code: 'FINANCIALS_NOT_FOUND' },
    });
  });

  it('health kiểm tra PostgreSQL thật', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(response.body).toMatchObject({
      data: {
        status: 'ready',
        components: { process: 'available', database: 'available' },
      },
    });
  });

  it('AI lỗi không làm API doanh nghiệp và tài chính ngừng hoạt động', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('AI is offline'));
    const ai = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .send({ query: 'Doanh thu FPT thế nào?', companyCode: 'FPT' })
      .expect(502);
    expect(ai.body).toMatchObject({
      error: { code: 'AI_SERVICE_UNAVAILABLE' },
    });

    await request(app.getHttpServer())
      .get('/api/v1/companies/FPT/profile')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/companies/FPT/financials')
      .expect(200);
  });
});
