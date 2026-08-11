// Mock companies data
import type {
  Company,
  ExchangeSummary,
  IndustrySummary,
  CompanyExecutiveSummary,
  Citation,
} from "@/lib/types";

export const mockExchangeHSX: ExchangeSummary = {
  exchangeId: 1,
  exchangeCode: "HSX",
  exchangeName: "Ho Chi Minh Stock Exchange",
};

export const mockExchangeHNX: ExchangeSummary = {
  exchangeId: 2,
  exchangeCode: "HNX",
  exchangeName: "Hanoi Stock Exchange",
};

export const mockIndustryBanking: IndustrySummary = {
  industryId: 1,
  industryCode: "BANKING",
  industryName: "Ngân hàng thương mại",
};

export const mockIndustryTech: IndustrySummary = {
  industryId: 2,
  industryCode: "TECH",
  industryName: "Công nghệ thông tin",
};

export const mockIndustrySteel: IndustrySummary = {
  industryId: 3,
  industryCode: "STEEL",
  industryName: "Thép và tài nguyên",
};

export const mockACBLeaders: CompanyExecutiveSummary[] = [
  {
    executiveId: 1,
    fullName: "Ông Trần Hùng Huy",
    position: "Chủ tịch Hội đồng Quản trị",
    startDate: "2019-04-01",
    endDate: null,
  },
  {
    executiveId: 2,
    fullName: "Ông Đào Hải Long",
    position: "Tổng Giám đốc (CEO)",
    startDate: "2020-01-15",
    endDate: null,
  },
  {
    executiveId: 3,
    fullName: "Bà Nguyễn Thị Mai Hoa",
    position: "Phó Tổng Giám đốc Tài chính (CFO)",
    startDate: "2018-06-01",
    endDate: null,
  },
  {
    executiveId: 4,
    fullName: "Ông Lê Quang Trung",
    position: "Phó Tổng Giám đốc Khách hàng Cá nhân",
    startDate: "2019-03-15",
    endDate: null,
  },
];

export const mockACBCitations: Citation[] = [
  {
    citationId: 1,
    documentId: 1,
    docTitle: "Báo cáo thường niên ACB 2025",
    sourceUrl: "https://www.acb.com.vn",
    locationRef: "Trang 15",
    excerpt: "Lợi nhuận tăng trưởng 15% so với năm 2024",
  },
  {
    citationId: 2,
    documentId: 2,
    docTitle: "Báo cáo tài chính Q4/2025",
    sourceUrl: "https://www.acb.com.vn",
    locationRef: "Trang 8",
    excerpt: "Tổng tài sản đạt 678.000 tỷ đồng",
  },
];

export const mockACB: Company = {
  companyId: 1,
  ticker: "ACB",
  companyName: "Ngân hàng Thương mại Cổ phần Á Châu",
  exchange: mockExchangeHSX,
  industry: mockIndustryBanking,
  listingDate: "2006-10-31",
  charterCapital: "44.150.599.600.000",
  description:
    "ACB là một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam, chuyên về mảng ngân hàng bán lẻ.",
  website: "https://www.acb.com.vn",
  executives: mockACBLeaders,
  citations: mockACBCitations,
};

export const mockVCB: Company = {
  companyId: 2,
  ticker: "VCB",
  companyName: "Ngân hàng Thương mại Cổ phần Ngoại thương Việt Nam",
  exchange: mockExchangeHSX,
  industry: mockIndustryBanking,
  listingDate: "2008-06-30",
  charterCapital: "123.088.655.700.000",
  description:
    "Vietcombank là ngân hàng thương mại cổ phần lớn nhất Việt Nam theo vốn điều lệ.",
  website: "https://www.vcb.com.vn",
  executives: [],
  citations: [],
};

export const mockFPT: Company = {
  companyId: 3,
  ticker: "FPT",
  companyName: "Công ty Cổ phần FPT",
  exchange: mockExchangeHSX,
  industry: mockIndustryTech,
  listingDate: "2006-12-01",
  charterCapital: "85.792.714.410.000",
  description:
    "FPT là tập đoàn công nghệ hàng đầu Việt Nam, hoạt động trong lĩnh vực CNTT, viễn thông và giáo dục.",
  website: "https://www.fpt.com.vn",
  executives: [],
  citations: [],
};

export const mockCompanies: Company[] = [mockACB, mockVCB, mockFPT];
