// ACB Dashboard Mock Data
import type {
  DashboardCompany,
  NewsItem,
  TimelineEvent,
  RiskIndicator,
} from "@/lib/types";

export const acbDashboardData: DashboardCompany = {
  companyId: 1,
  ticker: "ACB",
  companyName: "Ngân hàng Thương mại Cổ phần Á Châu",
  exchange: {
    exchangeId: 1,
    exchangeCode: "HSX",
    exchangeName: "Ho Chi Minh Stock Exchange",
  },
  industry: {
    industryId: 1,
    industryCode: "BANKING",
    industryName: "Ngân hàng thương mại",
  },
  summary:
    "ACB là một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam, chuyên về mảng ngân hàng bán lẻ.",
  description:
    "Ngân hàng TMCP Á Châu (ACB) được thành lập ngày 04/06/1993 với tầm nhìn xác định là trở thành ngân hàng TMCP bán lẻ hàng đầu Việt Nam.",
  website: "https://www.acb.com.vn",
  ceo: "Ông Đào Hải Long",
  sources: ["ACB Annual Report 2025", "ACB Financial Statements Q4/2025"],

  // Stock info
  marketCap: 158000000000000, // 158 nghìn tỷ
  sharePrice: 22500,
  change: 0,
  changePercent: 0,
  peRatio: 6.5,
  pbRatio: 1.2,
  eps: 4000,
  dividendYield: 5.2,
  volume: 15400000,
  high52Week: 28000,
  low52Week: 18500,

  // Financial Chart Data
  financialChartData: [
    { period: "Q3-2025", revenue: 8500, netProfit: 3200, totalAssets: 650000, liabilities: 580000, equity: 70000 },
    { period: "Q4-2025", revenue: 9200, netProfit: 3500, totalAssets: 668000, liabilities: 595000, equity: 73000 },
    { period: "Q1-2026", revenue: 8800, netProfit: 3300, totalAssets: 672000, liabilities: 598000, equity: 74000 },
    { period: "Q2-2026", revenue: 9500, netProfit: 3700, totalAssets: 678000, liabilities: 602000, equity: 76000 },
  ],

  // Leaders
  leaders: [
    {
      id: "1",
      name: "Ông Trần Hùng Huy",
      position: "Chủ tịch HĐQT",
      avatar: "",
      bio: "Sinh năm 1977, có hơn 20 năm kinh nghiệm trong lĩnh vực tài chính - ngân hàng.",
      tenureStart: "2019-04-01",
    },
    {
      id: "2",
      name: "Ông Đào Hải Long",
      position: "Tổng Giám đốc",
      avatar: "",
      bio: "Sinh năm 1975, gia nhập ACB từ năm 2010, giữ chức CEO từ 2020.",
      tenureStart: "2020-01-15",
    },
    {
      id: "3",
      name: "Bà Nguyễn Thị Mai Hoa",
      position: "CFO",
      avatar: "",
      bio: "Chịu trách nhiệm về tài chính và kế toán của ACB.",
      tenureStart: "2018-06-01",
    },
  ],

  citations: [
    {
      citationId: 1,
      documentId: 1,
      docTitle: "Báo cáo thường niên ACB 2025",
      sourceUrl: "https://www.acb.com.vn",
      locationRef: "Trang 15",
      excerpt: "Lợi nhuận tăng trưởng 15% so với năm 2024",
    },
  ],
};

export const acbNews: NewsItem[] = [
  {
    id: "1",
    title: "ACB công bố kết quả kinh doanh quý 2/2026",
    summary:
      "Lợi nhuận trước thuế đạt 3.700 tỷ đồng, tăng 12% so với cùng kỳ năm trước.",
    date: "2026-07-24",
    source: "ACB",
    category: "earnings",
    url: "#",
  },
  {
    id: "2",
    title: "ACB mở rộng mạng lưới chi nhánh tại miền Tây",
    summary:
      "Ngân hàng vừa khai trương 5 chi nhánh mới tại các tỉnh miền Tây Nam Bộ.",
    date: "2026-07-20",
    source: "VNE",
    category: "general",
    url: "#",
  },
  {
    id: "3",
    title: "ACB chi trả cổ tức tiền mặt 2025",
    summary:
      "Cổ tức 2025 được chi trả với tỷ lệ 25%, tương ứng 2.500 đồng/cổ phiếu.",
    date: "2026-07-15",
    source: "ACB",
    category: "dividend",
    url: "#",
  },
  {
    id: "4",
    title: "ACB nhận giải thưởng Ngân hàng số tiêu biểu 2026",
    summary:
      "ACB được vinh danh tại Diễn đàn Ngân hàng số Việt Nam 2026.",
    date: "2026-07-10",
    source: "VNB",
    category: "general",
    url: "#",
  },
];

export const acbTimeline: TimelineEvent[] = [
  {
    id: "1",
    date: "2026-07-24",
    title: "Công bố KQKD Q2/2026",
    description: "Lợi nhuận đạt 3.700 tỷ đồng",
    type: "report",
  },
  {
    id: "2",
    date: "2026-07-15",
    title: "Chi trả cổ tức",
    description: "Cổ tức 2.500 đồng/cổ phiếu",
    type: "dividend",
  },
  {
    id: "3",
    date: "2026-06-30",
    title: "Đại hội đồng cổ đông thường niên 2026",
    description: "Thông qua kế hoạch kinh doanh năm 2026",
    type: "meeting",
  },
  {
    id: "4",
    date: "2026-04-30",
    title: "Công bố KQKD Q1/2026",
    description: "Lợi nhuận đạt 3.300 tỷ đồng",
    type: "report",
  },
  {
    id: "5",
    date: "2025-04-04",
    title: "ACB kỷ niệm 32 năm thành lập",
    description: "Thành lập ngày 04/06/1993",
    type: "milestone",
  },
];

export const acbRiskIndicators: RiskIndicator[] = [
  {
    id: "1",
    name: "Đòn bẩy tài chính",
    level: "low",
    score: 20,
    description: "Tỷ lệ nợ/vốn chủ sở hữu ở mức an toàn",
    trend: "stable",
  },
  {
    id: "2",
    name: "Nợ xấu",
    level: "low",
    score: 15,
    description: "Tỷ lệ nợ xấu luôn kiểm soát chặt chẽ",
    trend: "improving",
  },
  {
    id: "3",
    name: "Thanh khoản",
    level: "low",
    score: 25,
    description: "Thanh khoản dồi dào, tỷ lệ LDR ổn định",
    trend: "stable",
  },
  {
    id: "4",
    name: "Định giá",
    level: "medium",
    score: 55,
    description: "P/E thấp hơn trung bình ngành",
    trend: "improving",
  },
];
