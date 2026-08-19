import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  const company = {
    companyId: 1,
    ticker: 'FPT',
    companyName: 'FPT Corporation',
    listingDate: new Date('2006-12-13T00:00:00.000Z'),
    charterCapital: new Prisma.Decimal('14701834710000'),
    website: 'https://fpt.com',
    description: 'Công ty công nghệ',
    exchange: {
      exchangeId: 1,
      exchangeCode: 'HOSE',
      exchangeName: 'Sở Giao dịch Chứng khoán TP.HCM',
    },
    industry: {
      industryId: 1,
      industryCode: 'TECH',
      industryName: 'Công nghệ',
    },
    executives: [
      {
        executiveId: 1,
        fullName: 'Nguyễn Văn A',
        position: 'Tổng giám đốc',
        startDate: new Date('2020-01-02T00:00:00.000Z'),
        endDate: null,
      },
    ],
  };

  const findMany = jest.fn();
  const findUnique = jest.fn();
  const findNews = jest.fn();
  const countNews = jest.fn();
  const prisma = {
    company: {
      findMany,
      findUnique,
    },
    newsArticle: {
      findMany: findNews,
      count: countNews,
    },
  } as unknown as PrismaService;

  let service: CompaniesService;

  beforeEach(() => {
    jest.clearAllMocks();
    findNews.mockResolvedValue([]);
    countNews.mockResolvedValue(0);
    service = new CompaniesService(prisma);
  });

  it('trả danh sách theo mã cổ phiếu và đúng định dạng API', async () => {
    findMany.mockResolvedValue([company]);

    const result = await service.listCompanies();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { ticker: 'asc' } }),
    );
    expect(result.data?.[0]).toMatchObject({
      ticker: 'FPT',
      listingDate: '2006-12-13',
      charterCapital: '14701834710000',
      citations: [],
      executives: [
        expect.objectContaining({
          startDate: '2020-01-02',
          endDate: null,
        }),
      ],
    });
  });

  it('chuẩn hóa mã cổ phiếu trước khi truy vấn', async () => {
    findUnique.mockResolvedValue(company);

    const result = await service.findByTicker('  fpt ');

    expect(result.data?.ticker).toBe('FPT');
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ticker: 'FPT' } }),
    );
  });

  it('trả mã lỗi rõ ràng khi không tìm thấy doanh nghiệp', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findByTicker('missing')).rejects.toMatchObject<
      Partial<NotFoundException>
    >({
      response: {
        statusCode: 404,
        message: 'Company not found',
        data: null,
        error: {
          code: 'COMPANY_NOT_FOUND',
          details: 'Company MISSING is not available',
        },
      },
    });
  });

  it('trả tin mới nhất đúng doanh nghiệp và không để HTML trong tóm tắt', async () => {
    findUnique.mockResolvedValue({ companyId: 1 });
    findNews.mockResolvedValue([
      {
        articleId: 10,
        title: 'FPT công bố kết quả kinh doanh',
        summary: '<script>alert(1)</script><b>Doanh thu tăng trưởng</b>',
        publishedAt: new Date('2026-08-18T09:30:00.000Z'),
        url: 'https://example.com/fpt-news',
        source: { sourceName: 'VnExpress RSS' },
        companies: [
          {
            company: {
              companyId: 1,
              ticker: 'FPT',
              companyName: 'FPT Corporation',
            },
          },
        ],
      },
    ]);
    countNews.mockResolvedValue(1);

    const result = await service.getCompanyNews(' fpt ', '2', '5');

    expect(findNews).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companies: { some: { companyId: 1 } } },
        skip: 5,
        take: 5,
        orderBy: [
          { publishedAt: { sort: 'desc', nulls: 'last' } },
          { articleId: 'desc' },
        ],
      }),
    );
    expect(result.data).toEqual({
      items: [
        {
          articleId: 10,
          sourceName: 'VnExpress RSS',
          title: 'FPT công bố kết quả kinh doanh',
          summary: 'Doanh thu tăng trưởng',
          publishedAt: '2026-08-18T09:30:00.000Z',
          url: 'https://example.com/fpt-news',
          companies: [
            {
              companyId: 1,
              ticker: 'FPT',
              companyName: 'FPT Corporation',
            },
          ],
        },
      ],
      page: 2,
      limit: 5,
      total: 1,
      totalPages: 1,
    });
    expect(result.data?.items[0]).not.toHaveProperty('sentimentLabel');
  });

  it('trả danh sách rỗng khi doanh nghiệp chưa có tin', async () => {
    findUnique.mockResolvedValue({ companyId: 1 });

    const result = await service.getCompanyNews('FPT');

    expect(result.data).toEqual({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it.each([
    ['0', undefined, 'Page must be a positive integer'],
    ['abc', undefined, 'Page must be a positive integer'],
    [undefined, '51', 'Limit must not exceed 50'],
  ])('từ chối phân trang không hợp lệ', async (page, limit, details) => {
    await expect(
      service.getCompanyNews('FPT', page, limit),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        error: { code: 'INVALID_PAGINATION', details },
      },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('trả COMPANY_NOT_FOUND khi lấy tin của doanh nghiệp không tồn tại', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getCompanyNews('missing')).rejects.toMatchObject({
      response: {
        statusCode: 404,
        error: { code: 'COMPANY_NOT_FOUND' },
      },
    });
    expect(findNews).not.toHaveBeenCalled();
  });
});
