import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiResponse, FinancialSummary } from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithDatabase('Financial API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let companyId: number | undefined;
  let exchangeId: number | undefined;
  let industryId: number | undefined;
  let metricIds: number[] = [];
  let reportIds: number[] = [];
  let ticker: string;
  let assetMetricCode: string;
  let profitMetricCode: string;
  let revenueMetricCode: string;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = Date.now().toString().slice(-6);
    ticker = `B4${suffix}`;
    assetMetricCode = `ASSET_${suffix}`;
    profitMetricCode = `PROFIT_${suffix}`;
    revenueMetricCode = `REVENUE_${suffix}`;

    const exchange = await prisma.exchange.create({
      data: { exchangeCode: `B4${suffix}`, exchangeName: 'B4 Test Exchange' },
    });
    exchangeId = exchange.exchangeId;
    const industry = await prisma.industry.create({
      data: { industryCode: `B4${suffix}`, industryName: 'B4 Test Industry' },
    });
    industryId = industry.industryId;
    const company = await prisma.company.create({
      data: {
        ticker,
        companyName: 'B4 Database Company',
        exchangeId,
        industryId,
      },
    });
    companyId = company.companyId;

    const metrics = await Promise.all([
      prisma.metric.create({
        data: {
          metricCode: assetMetricCode,
          metricName: 'Tổng tài sản',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
      }),
      prisma.metric.create({
        data: {
          metricCode: profitMetricCode,
          metricName: 'Lợi nhuận sau thuế',
          unit: 'VND',
          statementType: 'income_statement',
        },
      }),
      prisma.metric.create({
        data: {
          metricCode: revenueMetricCode,
          metricName: 'Doanh thu',
          unit: 'VND',
          statementType: 'income_statement',
        },
      }),
    ]);
    metricIds = metrics.map((metric) => metric.metricId);

    const filteredReport = await prisma.financialReport.create({
      data: {
        companyId,
        periodType: 'Q',
        fiscalYear: 2025,
        fiscalQuarter: 4,
        reportDate: new Date('2025-12-31T00:00:00.000Z'),
      },
    });
    const latestReport = await prisma.financialReport.create({
      data: {
        companyId,
        periodType: 'Q',
        fiscalYear: 2026,
        fiscalQuarter: 1,
        reportDate: new Date('2026-03-31T00:00:00.000Z'),
      },
    });
    reportIds = [filteredReport.reportId, latestReport.reportId];

    await prisma.financialLineItem.createMany({
      data: [
        {
          reportId: filteredReport.reportId,
          metricId: metrics[2].metricId,
          value: '9876543210.1234',
        },
        {
          reportId: filteredReport.reportId,
          metricId: metrics[0].metricId,
          value: '5000000000.0000',
        },
        {
          reportId: filteredReport.reportId,
          metricId: metrics[1].metricId,
          value: '123456789.4321',
        },
        {
          reportId: latestReport.reportId,
          metricId: metrics[2].metricId,
          value: '1111111111.1111',
        },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) {
      if (reportIds.length) {
        await prisma.financialLineItem.deleteMany({
          where: { reportId: { in: reportIds } },
        });
        await prisma.financialReport.deleteMany({
          where: { reportId: { in: reportIds } },
        });
      }
      if (metricIds.length) {
        await prisma.metric.deleteMany({
          where: { metricId: { in: metricIds } },
        });
      }
      if (companyId !== undefined) {
        await prisma.company.deleteMany({ where: { companyId } });
      }
      if (exchangeId !== undefined) {
        await prisma.exchange.deleteMany({ where: { exchangeId } });
      }
      if (industryId !== undefined) {
        await prisma.industry.deleteMany({ where: { industryId } });
      }
    }
    await app?.close();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('không có bộ lọc thì trả kỳ mới nhất', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${ticker}/financials`)
      .expect(200);
    const body = response.body as ApiResponse<FinancialSummary>;

    expect(body.data).toMatchObject({
      ticker,
      fiscalYear: 2026,
      fiscalQuarter: 1,
      reportDate: '2026-03-31',
    });
  });

  it('lọc đúng kỳ, giữ Decimal dạng chuỗi và sắp xếp metric ổn định', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/api/v1/companies/${ticker.toLowerCase()}/financials?year=2025&quarter=4`,
      )
      .expect(200);
    const body = response.body as ApiResponse<FinancialSummary>;

    expect(body.data).toMatchObject({
      ticker,
      fiscalYear: 2025,
      fiscalQuarter: 4,
      reportDate: '2025-12-31',
    });
    expect(body.data?.lineItems.map((item) => item.metric.metricCode)).toEqual([
      assetMetricCode,
      profitMetricCode,
      revenueMetricCode,
    ]);
    expect(body.data?.lineItems[2].value).toBe('9876543210.1234');
  });

  it('từ chối quý không hợp lệ', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${ticker}/financials?year=2025&quarter=5`)
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: { code: 'INVALID_FINANCIAL_PERIOD' },
    });
  });

  it('trả FINANCIALS_NOT_FOUND khi kỳ không có dữ liệu', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${ticker}/financials?year=2024&quarter=4`)
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: { code: 'FINANCIALS_NOT_FOUND' },
    });
  });
});
