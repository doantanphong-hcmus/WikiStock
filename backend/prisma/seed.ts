import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const metrics = [
  ['TOTAL_ASSETS', 'Tổng tài sản', 'VND', 'balance_sheet'],
  ['TOTAL_LIABILITIES', 'Tổng nợ phải trả', 'VND', 'balance_sheet'],
  ['TOTAL_EQUITY', 'Vốn chủ sở hữu', 'VND', 'balance_sheet'],
  ['SHORT_TERM_ASSETS', 'Tài sản ngắn hạn', 'VND', 'balance_sheet'],
  ['LONG_TERM_ASSETS', 'Tài sản dài hạn', 'VND', 'balance_sheet'],
  ['SHORT_TERM_LIABILITIES', 'Nợ ngắn hạn', 'VND', 'balance_sheet'],
  ['LONG_TERM_LIABILITIES', 'Nợ dài hạn', 'VND', 'balance_sheet'],
  ['REVENUE', 'Doanh thu', 'VND', 'income_statement'],
  ['GROSS_PROFIT', 'Lợi nhuận gộp', 'VND', 'income_statement'],
  ['OPERATING_PROFIT', 'Lợi nhuận hoạt động', 'VND', 'income_statement'],
  ['NET_PROFIT', 'Lợi nhuận sau thuế', 'VND', 'income_statement'],
  ['EPS', 'Lãi cơ bản trên cổ phiếu', 'VND', 'income_statement'],
  ['OPERATING_CASH_FLOW', 'Dòng tiền hoạt động kinh doanh', 'VND', 'cash_flow'],
  ['INVESTING_CASH_FLOW', 'Dòng tiền hoạt động đầu tư', 'VND', 'cash_flow'],
  ['FINANCING_CASH_FLOW', 'Dòng tiền hoạt động tài chính', 'VND', 'cash_flow'],
  ['ROE', 'Tỷ suất sinh lợi trên vốn chủ sở hữu', '%', 'ratio'],
  ['ROA', 'Tỷ suất sinh lợi trên tài sản', '%', 'ratio'],
  ['PE', 'Hệ số P/E', 'ratio', 'ratio'],
  ['PB', 'Hệ số P/B', 'ratio', 'ratio'],
  ['DEBT_TO_EQUITY', 'Hệ số nợ/vốn chủ sở hữu', 'ratio', 'ratio'],
  ['CURRENT_RATIO', 'Hệ số thanh toán hiện hành', 'ratio', 'ratio'],
  ['QUICK_RATIO', 'Hệ số thanh toán nhanh', 'ratio', 'ratio'],
  ['GROSS_MARGIN', 'Biên lợi nhuận gộp', '%', 'ratio'],
  ['NET_MARGIN', 'Biên lợi nhuận ròng', '%', 'ratio'],
  ['ASSET_TURNOVER', 'Vòng quay tài sản', 'lần', 'ratio'],
] as const;

// Chỉ seed danh mục nguồn chính thức. Các feed cụ thể do crawler quản lý.
const rssNewsSources = [
  ['VnExpress RSS', 'https://vnexpress.net/rss'],
  ['Thanh Nien RSS', 'https://thanhnien.vn/rss.html'],
  ['Tuoi Tre RSS', 'https://tuoitre.vn/nld/rss.htm'],
  ['CafeBiz RSS', 'https://cafebiz.vn/index.rss'],
  ['VnEconomy RSS', 'https://vneconomy.vn/rss.html'],
] as const;

async function main() {
  for (const roleName of ['admin', 'user']) {
    await prisma.userRole.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }

  const exchange = await prisma.exchange.upsert({
    where: { exchangeCode: 'HOSE' },
    update: { exchangeName: 'Ho Chi Minh Stock Exchange' },
    create: {
      exchangeCode: 'HOSE',
      exchangeName: 'Ho Chi Minh Stock Exchange',
    },
  });

  const industries = new Map<string, number>();
  for (const [industryCode, industryName] of [
    ['TECH', 'Technology'],
    ['ENERGY', 'Energy'],
    ['STEEL', 'Steel'],
  ] as const) {
    const industry = await prisma.industry.upsert({
      where: { industryCode },
      update: { industryName },
      create: { industryCode, industryName },
    });
    industries.set(industryCode, industry.industryId);
  }

  for (const [ticker, companyName, industryCode] of [
    ['FPT', 'FPT Corporation', 'TECH'],
    ['GAS', 'PetroVietnam Gas Joint Stock Corporation', 'ENERGY'],
    ['HPG', 'Hoa Phat Group Joint Stock Company', 'STEEL'],
    ['HSG', 'Hoa Sen Group Joint Stock Company', 'STEEL'],
  ] as const) {
    const industryId = industries.get(industryCode);
    if (!industryId) throw new Error(`Missing seeded industry ${industryCode}`);
    await prisma.company.upsert({
      where: { ticker },
      update: {},
      create: {
        ticker,
        companyName,
        exchangeId: exchange.exchangeId,
        industryId,
      },
    });
  }

  for (const source of [
    {
      sourceName: 'WikiStock seed PDF',
      sourceType: 'internal',
      reliabilityTier: 5,
      costTier: 'free',
      accessUrl: null,
    },
    {
      sourceName: 'vnstock',
      sourceType: 'aggregator',
      reliabilityTier: 3,
      costTier: 'free',
      accessUrl: 'https://github.com/thinh-vu/vnstock',
    },
  ]) {
    await prisma.dataSource.upsert({
      where: { sourceName: source.sourceName },
      update: source,
      create: source,
    });
  }

  for (const [sourceName, accessUrl] of rssNewsSources) {
    await prisma.dataSource.upsert({
      where: { sourceName },
      // Không cập nhật reliabilityTier để giữ đánh giá được team bổ sung sau này.
      update: { sourceType: 'news', costTier: 'free', accessUrl },
      create: { sourceName, sourceType: 'news', costTier: 'free', accessUrl },
    });
  }

  for (const typeName of ['financial_statement', 'annual_report']) {
    await prisma.documentType.upsert({
      where: { typeName },
      update: {},
      create: { typeName },
    });
  }

  for (const [metricCode, metricName, unit, statementType] of metrics) {
    await prisma.metric.upsert({
      where: { metricCode },
      update: { metricName, unit, statementType },
      create: { metricCode, metricName, unit, statementType },
    });
  }

  console.log(
    `Seeded ${metrics.length} financial metrics, ${rssNewsSources.length} RSS news sources and V1 lookups.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
