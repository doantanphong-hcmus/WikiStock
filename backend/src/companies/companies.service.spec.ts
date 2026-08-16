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
  const prisma = {
    company: {
      findMany,
      findUnique,
    },
  } as unknown as PrismaService;

  let service: CompaniesService;

  beforeEach(() => {
    jest.clearAllMocks();
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
});
