import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiResponse, CompanyNewsPage } from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithDatabase('Company news API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let exchangeId: number | undefined;
  let industryId: number | undefined;
  let sourceId: number | undefined;
  let companyIds: number[] = [];
  let articleIds: number[] = [];
  let ticker: string;
  let emptyTicker: string;
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
    ticker = `N6A${suffix}`;
    emptyTicker = `N6E${suffix}`;
    const exchange = await prisma.exchange.create({
      data: { exchangeCode: `N6${suffix}`, exchangeName: 'N6 Test Exchange' },
    });
    exchangeId = exchange.exchangeId;
    const industry = await prisma.industry.create({
      data: { industryCode: `N6${suffix}`, industryName: 'N6 Test Industry' },
    });
    industryId = industry.industryId;
    const companies = await Promise.all(
      [ticker, `N6B${suffix}`, emptyTicker].map((companyTicker) =>
        prisma.company.create({
          data: {
            ticker: companyTicker,
            companyName: `${companyTicker} Company`,
            exchangeId,
            industryId,
          },
        }),
      ),
    );
    companyIds = companies.map((company) => company.companyId);
    const source = await prisma.dataSource.create({
      data: {
        sourceName: `N6 RSS ${suffix}`,
        sourceType: 'news',
        costTier: 'free',
        accessUrl: 'https://example.com/rss',
      },
    });
    sourceId = source.sourceId;

    const articles = await Promise.all([
      prisma.newsArticle.create({
        data: {
          sourceId,
          title: 'Bài mới nhất của doanh nghiệp N6A',
          summary: '<script>alert(1)</script><b>Tóm tắt an toàn</b>',
          url: `https://example.com/n6-latest-${suffix}`,
          publishedAt: new Date('2026-08-18T10:00:00.000Z'),
        },
      }),
      prisma.newsArticle.create({
        data: {
          sourceId,
          title: 'Bài cũ hơn của doanh nghiệp N6A',
          summary: 'Nội dung cũ hơn',
          url: `https://example.com/n6-older-${suffix}`,
          publishedAt: new Date('2026-08-17T10:00:00.000Z'),
        },
      }),
      prisma.newsArticle.create({
        data: {
          sourceId,
          title: 'Bài chỉ thuộc doanh nghiệp N6B',
          summary: 'Không được trả về cho N6A',
          url: `https://example.com/n6-unrelated-${suffix}`,
          publishedAt: new Date('2026-08-19T10:00:00.000Z'),
        },
      }),
    ]);
    articleIds = articles.map((article) => article.articleId);
    await prisma.newsArticleCompany.createMany({
      data: [
        { articleId: articleIds[0], companyId: companyIds[0] },
        { articleId: articleIds[0], companyId: companyIds[1] },
        { articleId: articleIds[1], companyId: companyIds[0] },
        { articleId: articleIds[2], companyId: companyIds[1] },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) {
      if (articleIds.length) {
        await prisma.newsArticleCompany.deleteMany({
          where: { articleId: { in: articleIds } },
        });
        await prisma.newsArticle.deleteMany({
          where: { articleId: { in: articleIds } },
        });
      }
      if (companyIds.length) {
        await prisma.company.deleteMany({
          where: { companyId: { in: companyIds } },
        });
      }
      if (sourceId !== undefined) {
        await prisma.dataSource.deleteMany({ where: { sourceId } });
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

  it('phân trang đúng, không lẫn bài và không trả HTML nguy hiểm', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${ticker.toLowerCase()}/news?page=1&limit=1`)
      .expect(200);
    const body = response.body as ApiResponse<CompanyNewsPage>;

    expect(body.data).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
      items: [
        {
          title: 'Bài mới nhất của doanh nghiệp N6A',
          summary: 'Tóm tắt an toàn',
          publishedAt: '2026-08-18T10:00:00.000Z',
        },
      ],
    });
    expect(body.data?.items[0].url).toContain('n6-latest');
    expect(
      body.data?.items[0].companies.map((company) => company.ticker),
    ).toEqual([ticker, `N6B${ticker.slice(3)}`]);
    expect(body.data?.items[0]).not.toHaveProperty('sentimentLabel');
    expect(JSON.stringify(body.data)).not.toContain('n6-unrelated');
  });

  it('trả trang tiếp theo theo thứ tự mới nhất trước', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${ticker}/news?page=2&limit=1`)
      .expect(200);
    const body = response.body as ApiResponse<CompanyNewsPage>;

    expect(body.data?.items).toHaveLength(1);
    expect(body.data?.items[0].title).toBe('Bài cũ hơn của doanh nghiệp N6A');
  });

  it('trả danh sách rỗng khi doanh nghiệp chưa có tin', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/companies/${emptyTicker}/news`)
      .expect(200);
    const body = response.body as ApiResponse<CompanyNewsPage>;

    expect(body.data).toEqual({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });
});
