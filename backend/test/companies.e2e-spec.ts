import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiResponse, CompanyProfile } from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithDatabase('Company API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let companyId: number | undefined;
  let executiveId: number | undefined;
  let exchangeId: number | undefined;
  let industryId: number | undefined;
  let ticker: string;
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
    ticker = `B3${suffix}`;
    const exchange = await prisma.exchange.create({
      data: { exchangeCode: `B3${suffix}`, exchangeName: 'B3 Test Exchange' },
    });
    exchangeId = exchange.exchangeId;
    const industry = await prisma.industry.create({
      data: { industryCode: `B3${suffix}`, industryName: 'B3 Test Industry' },
    });
    industryId = industry.industryId;
    const company = await prisma.company.create({
      data: {
        ticker,
        companyName: 'B3 Database Company',
        exchangeId,
        industryId,
        listingDate: new Date('2020-05-06T00:00:00.000Z'),
        charterCapital: '1234567890.12',
        website: 'https://example.com',
        description: 'Dữ liệu kiểm thử B3',
      },
    });
    companyId = company.companyId;
    const executive = await prisma.companyExecutive.create({
      data: {
        companyId,
        fullName: 'B3 Executive',
        position: 'Giám đốc',
        startDate: new Date('2021-01-02T00:00:00.000Z'),
      },
    });
    executiveId = executive.executiveId;
  });

  afterAll(async () => {
    if (prisma) {
      if (executiveId !== undefined) {
        await prisma.companyExecutive.deleteMany({ where: { executiveId } });
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

  it('trả danh sách từ cơ sở dữ liệu theo thứ tự mã cổ phiếu', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/companies')
      .expect(200);
    const body = response.body as ApiResponse<CompanyProfile[]>;
    const tickers = body.data?.map((company) => company.ticker) ?? [];
    const seededCompany = body.data?.find(
      (company) => company.ticker === ticker,
    );

    expect(tickers).toEqual([...tickers].sort());
    expect(seededCompany).toMatchObject({
      companyName: 'B3 Database Company',
      listingDate: '2020-05-06',
      charterCapital: '1234567890.12',
      exchange: { exchangeName: 'B3 Test Exchange' },
      industry: { industryName: 'B3 Test Industry' },
      executives: [
        expect.objectContaining({
          fullName: 'B3 Executive',
          startDate: '2021-01-02',
        }),
      ],
      citations: [],
    });
  });

  it('tìm được doanh nghiệp khi mã cổ phiếu viết thường', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${ticker.toLowerCase()}/profile`)
      .expect(200);
    const body = response.body as ApiResponse<CompanyProfile>;

    expect(body.data?.ticker).toBe(ticker);
    expect(body.data?.companyName).toBe('B3 Database Company');
  });

  it('trả COMPANY_NOT_FOUND khi doanh nghiệp không tồn tại', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/companies/B3UNKNOWN/profile')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: { code: 'COMPANY_NOT_FOUND' },
    });
  });
});
