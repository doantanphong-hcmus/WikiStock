import {
  Citation,
  CompanyProfile,
  DocumentSummary,
  FinancialSummary,
} from '../types/api.types';

export const mockCitations: Record<string, Citation[]> = {
  FPT: [
    {
      id: 'ref-fpt-01',
      docTitle: 'Báo cáo tài chính kiểm toán hợp nhất 2025',
      sourceUrl: 'https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf',
      pageNumber: 24,
      matchedText:
        'Doanh thu và lợi nhuận sau thuế tiếp tục tăng nhờ mảng dịch vụ công nghệ.',
    },
    {
      id: 'ref-fpt-02',
      docTitle: 'Báo cáo thường niên FPT 2025',
      sourceUrl: 'https://wikistock.vn/docs/fpt/annual-report-2025.pdf',
      pageNumber: 8,
      matchedText:
        'FPT duy trì định hướng tăng trưởng dựa trên chuyển đổi số và thị trường nước ngoài.',
    },
  ],
  CMG: [
    {
      id: 'ref-cmg-01',
      docTitle: 'Báo cáo thường niên CMG 2025',
      sourceUrl: 'https://wikistock.vn/docs/cmg/annual-report-2025.pdf',
      pageNumber: 12,
      matchedText:
        'CMG tập trung vào hạ tầng số, dịch vụ đám mây và an toàn thông tin.',
    },
  ],
};

export const mockCompanies: CompanyProfile[] = [
  {
    ticker: 'FPT',
    companyCode: 'FPT',
    name: 'Công ty Cổ phần FPT',
    exchange: 'HOSE',
    industry: 'Công nghệ thông tin',
    description:
      'Tập đoàn công nghệ hàng đầu Việt Nam với hoạt động trong lĩnh vực CNTT, viễn thông và dịch vụ số.',
    website: 'https://fpt.com',
    ceo: 'Nguyễn Văn Khoa',
    summary:
      'FPT là một trong những doanh nghiệp công nghệ hàng đầu tại Việt Nam.',
    sources: ['Báo cáo tài chính 2025', 'Annual report 2025'],
    citations: mockCitations.FPT,
  },
  {
    ticker: 'CMG',
    companyCode: 'CMG',
    name: 'Công ty Cổ phần Tập đoàn Công nghệ CMC',
    exchange: 'HOSE',
    industry: 'Công nghệ thông tin',
    description:
      'Tập đoàn công nghệ Việt Nam hoạt động trong hạ tầng số, dịch vụ cloud, an toàn thông tin và tích hợp hệ thống.',
    website: 'https://cmg.vn',
    ceo: 'Nguyễn Trung Chính',
    summary:
      'CMG là doanh nghiệp công nghệ với trọng tâm hạ tầng số và dịch vụ doanh nghiệp.',
    sources: ['Báo cáo thường niên 2025'],
    citations: mockCitations.CMG,
  },
];

export const mockFinancials: Record<string, FinancialSummary> = {
  FPT: {
    companyCode: 'FPT',
    year: 2025,
    quarter: 4,
    revenue: 50000000000,
    netProfit: 8000000000,
    totalAssets: 70000000000,
    liabilities: 30000000000,
    equity: 40000000000,
  },
  CMG: {
    companyCode: 'CMG',
    year: 2025,
    quarter: 4,
    revenue: 18000000000,
    netProfit: 1200000000,
    totalAssets: 26000000000,
    liabilities: 11000000000,
    equity: 15000000000,
  },
};

export const mockDocuments: Record<string, DocumentSummary[]> = {
  FPT: [
    {
      id: 'doc-fpt-2025-fs',
      companyCode: 'FPT',
      title: 'Báo cáo tài chính kiểm toán hợp nhất 2025',
      type: 'financial_statement',
      year: 2025,
      sourceUrl: 'https://wikistock.vn/docs/fpt/bctc-2025-kiemtoan.pdf',
    },
    {
      id: 'doc-fpt-2025-ar',
      companyCode: 'FPT',
      title: 'Báo cáo thường niên FPT 2025',
      type: 'annual_report',
      year: 2025,
      sourceUrl: 'https://wikistock.vn/docs/fpt/annual-report-2025.pdf',
    },
  ],
  CMG: [
    {
      id: 'doc-cmg-2025-ar',
      companyCode: 'CMG',
      title: 'Báo cáo thường niên CMG 2025',
      type: 'annual_report',
      year: 2025,
      sourceUrl: 'https://wikistock.vn/docs/cmg/annual-report-2025.pdf',
    },
  ],
};

export function findMockCompany(
  companyCode: string,
): CompanyProfile | undefined {
  return mockCompanies.find(
    (item) => item.companyCode.toUpperCase() === companyCode.toUpperCase(),
  );
}
