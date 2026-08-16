import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FinancialsService } from './financials.service';

describe('FinancialsService', () => {
  const report = {
    reportId: 2,
    companyId: 1,
    periodType: 'Q',
    fiscalYear: 2025,
    fiscalQuarter: 4,
    reportDate: new Date('2025-12-31T00:00:00.000Z'),
    lineItems: [
      {
        lineItemId: 1,
        value: new Prisma.Decimal('1234567890.1234'),
        metric: {
          metricId: 1,
          metricCode: 'REVENUE',
          metricName: 'Doanh thu',
          unit: 'VND',
          statementType: 'income_statement',
        },
      },
    ],
  };

  const findCompany = jest.fn();
  const findReport = jest.fn();
  const prisma = {
    company: { findUnique: findCompany },
    financialReport: { findFirst: findReport },
  } as unknown as PrismaService;

  let service: FinancialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    findCompany.mockResolvedValue({ companyId: 1, ticker: 'FPT' });
    findReport.mockResolvedValue(report);
    service = new FinancialsService(prisma);
  });

  it('lấy kỳ mới nhất và giữ nguyên độ chính xác của số tài chính', async () => {
    const result = await service.getFinancials('FPT');

    expect(findReport).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: 1,
          fiscalYear: undefined,
          fiscalQuarter: undefined,
        },
        orderBy: [
          { fiscalYear: 'desc' },
          { fiscalQuarter: { sort: 'desc', nulls: 'last' } },
          { reportDate: { sort: 'desc', nulls: 'last' } },
          { reportId: 'desc' },
        ],
      }),
    );
    expect(result.data).toMatchObject({
      ticker: 'FPT',
      reportDate: '2025-12-31',
      lineItems: [{ value: '1234567890.1234' }],
    });
  });

  it('chuẩn hóa mã cổ phiếu và lọc đúng năm, quý', async () => {
    await service.getFinancials('  fpt ', '2025', '4');

    expect(findCompany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ticker: 'FPT' } }),
    );
    expect(findReport).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 1, fiscalYear: 2025, fiscalQuarter: 4 },
      }),
    );
  });

  it.each([
    ['2025', '0', 'Quarter must be an integer from 1 to 4'],
    ['2025', '5', 'Quarter must be an integer from 1 to 4'],
    ['2025.5', undefined, 'Year must be an integer from 1900 to 9999'],
    ['1899', undefined, 'Year must be an integer from 1900 to 9999'],
  ])('từ chối kỳ không hợp lệ', async (year, quarter, details) => {
    await expect(
      service.getFinancials('FPT', year, quarter),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        error: { code: 'INVALID_FINANCIAL_PERIOD', details },
      },
    });
    expect(findCompany).not.toHaveBeenCalled();
  });

  it('từ chối quý khi không có năm', async () => {
    await expect(
      service.getFinancials('FPT', undefined, '4'),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        error: {
          code: 'INVALID_FINANCIAL_PERIOD',
          details: 'Quarter requires a year',
        },
      },
    });
  });

  it('trả lỗi riêng khi doanh nghiệp không tồn tại', async () => {
    findCompany.mockResolvedValue(null);

    await expect(service.getFinancials('missing')).rejects.toMatchObject({
      response: {
        statusCode: 404,
        error: { code: 'COMPANY_NOT_FOUND' },
      },
    });
    expect(findReport).not.toHaveBeenCalled();
  });

  it('trả FINANCIALS_NOT_FOUND khi không có kỳ phù hợp', async () => {
    findReport.mockResolvedValue(null);

    await expect(
      service.getFinancials('FPT', '2024', '1'),
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        error: { code: 'FINANCIALS_NOT_FOUND' },
      },
    });
  });
});
