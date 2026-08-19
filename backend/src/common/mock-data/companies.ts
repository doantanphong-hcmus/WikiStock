import { Citation, CompanyProfile, FinancialSummary } from '../types/api.types';

const hoseExchange = {
  exchangeId: 1,
  exchangeCode: 'HOSE',
  exchangeName: 'Sở Giao dịch Chứng khoán TP. Hồ Chí Minh',
};

const technologyIndustry = {
  industryId: 1,
  industryCode: 'TECH',
  industryName: 'Công nghệ thông tin',
};

export const mockCitations: Record<string, Citation[]> = {
  FPT: [
    {
      citationId: 1,
      documentId: 1,
      docTitle: 'Báo cáo tài chính kiểm toán hợp nhất 2025',
      sourceUrl: 'https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf',
      locationRef: 'Trang 24',
      excerpt:
        'Doanh thu và lợi nhuận sau thuế tiếp tục tăng nhờ mảng dịch vụ công nghệ.',
    },
    {
      citationId: 2,
      documentId: 2,
      docTitle: 'Báo cáo thường niên FPT 2025',
      sourceUrl: 'https://wikistock.vn/docs/fpt/annual-report-2025.pdf',
      locationRef: 'Trang 8',
      excerpt:
        'FPT duy trì định hướng tăng trưởng dựa trên chuyển đổi số và thị trường nước ngoài.',
    },
  ],
  CMG: [
    {
      citationId: 3,
      documentId: 3,
      docTitle: 'Báo cáo thường niên CMG 2025',
      sourceUrl: 'https://wikistock.vn/docs/cmg/annual-report-2025.pdf',
      locationRef: 'Trang 12',
      excerpt:
        'CMG tập trung vào hạ tầng số, dịch vụ đám mây và an toàn thông tin.',
    },
  ],
};

export const mockCompanies: CompanyProfile[] = [
  {
    companyId: 1,
    ticker: 'FPT',
    companyName: 'Công ty Cổ phần FPT',
    exchange: hoseExchange,
    industry: technologyIndustry,
    listingDate: '2006-12-13',
    charterCapital: '14700000000000.00',
    website: 'https://fpt.com',
    description:
      'Tập đoàn công nghệ hàng đầu Việt Nam với hoạt động trong lĩnh vực CNTT, viễn thông và dịch vụ số.',
    executives: [
      {
        executiveId: 1,
        fullName: 'Nguyễn Văn Khoa',
        position: 'Tổng Giám đốc',
        startDate: null,
        endDate: null,
      },
    ],
    citations: mockCitations.FPT,
  },
  {
    companyId: 2,
    ticker: 'CMG',
    companyName: 'Công ty Cổ phần Tập đoàn Công nghệ CMC',
    exchange: hoseExchange,
    industry: technologyIndustry,
    listingDate: '2010-01-22',
    charterCapital: '1500000000000.00',
    website: 'https://cmg.vn',
    description:
      'Tập đoàn công nghệ Việt Nam hoạt động trong hạ tầng số, dịch vụ cloud, an toàn thông tin và tích hợp hệ thống.',
    executives: [
      {
        executiveId: 2,
        fullName: 'Nguyễn Trung Chính',
        position: 'Chủ tịch Hội đồng Quản trị',
        startDate: null,
        endDate: null,
      },
    ],
    citations: mockCitations.CMG,
  },
];

export const mockFinancials: Record<string, FinancialSummary> = {
  FPT: {
    reportId: 1,
    companyId: 1,
    ticker: 'FPT',
    periodType: 'Q',
    fiscalYear: 2025,
    fiscalQuarter: 4,
    reportDate: '2026-01-26',
    lineItems: [
      {
        lineItemId: 1,
        metric: {
          metricId: 1,
          metricCode: 'REVENUE',
          metricName: 'Doanh thu',
          unit: 'VND',
          statementType: 'income_statement',
        },
        value: '50000000000.0000',
      },
      {
        lineItemId: 2,
        metric: {
          metricId: 2,
          metricCode: 'NET_PROFIT',
          metricName: 'Lợi nhuận sau thuế',
          unit: 'VND',
          statementType: 'income_statement',
        },
        value: '8000000000.0000',
      },
      {
        lineItemId: 3,
        metric: {
          metricId: 3,
          metricCode: 'TOTAL_ASSETS',
          metricName: 'Tổng tài sản',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
        value: '70000000000.0000',
      },
      {
        lineItemId: 4,
        metric: {
          metricId: 4,
          metricCode: 'LIABILITIES',
          metricName: 'Nợ phải trả',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
        value: '30000000000.0000',
      },
      {
        lineItemId: 5,
        metric: {
          metricId: 5,
          metricCode: 'EQUITY',
          metricName: 'Vốn chủ sở hữu',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
        value: '40000000000.0000',
      },
    ],
  },
  CMG: {
    reportId: 2,
    companyId: 2,
    ticker: 'CMG',
    periodType: 'Q',
    fiscalYear: 2025,
    fiscalQuarter: 4,
    reportDate: '2026-01-30',
    lineItems: [
      {
        lineItemId: 6,
        metric: {
          metricId: 1,
          metricCode: 'REVENUE',
          metricName: 'Doanh thu',
          unit: 'VND',
          statementType: 'income_statement',
        },
        value: '18000000000.0000',
      },
      {
        lineItemId: 7,
        metric: {
          metricId: 2,
          metricCode: 'NET_PROFIT',
          metricName: 'Lợi nhuận sau thuế',
          unit: 'VND',
          statementType: 'income_statement',
        },
        value: '1200000000.0000',
      },
      {
        lineItemId: 8,
        metric: {
          metricId: 3,
          metricCode: 'TOTAL_ASSETS',
          metricName: 'Tổng tài sản',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
        value: '26000000000.0000',
      },
      {
        lineItemId: 9,
        metric: {
          metricId: 4,
          metricCode: 'LIABILITIES',
          metricName: 'Nợ phải trả',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
        value: '11000000000.0000',
      },
      {
        lineItemId: 10,
        metric: {
          metricId: 5,
          metricCode: 'EQUITY',
          metricName: 'Vốn chủ sở hữu',
          unit: 'VND',
          statementType: 'balance_sheet',
        },
        value: '15000000000.0000',
      },
    ],
  },
};

export function findMockCompany(ticker: string): CompanyProfile | undefined {
  return mockCompanies.find(
    (item) => item.ticker.toUpperCase() === ticker.toUpperCase(),
  );
}
