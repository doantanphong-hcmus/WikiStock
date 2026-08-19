import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApiResponse,
  CompanyNewsItem,
  CompanyNewsPage,
  CompanyProfile,
} from '../common/types/api.types';
import { PrismaService } from '../database/prisma.service';

const companyProfileSelect = {
  companyId: true,
  ticker: true,
  companyName: true,
  listingDate: true,
  charterCapital: true,
  website: true,
  description: true,
  exchange: {
    select: {
      exchangeId: true,
      exchangeCode: true,
      exchangeName: true,
    },
  },
  industry: {
    select: {
      industryId: true,
      industryCode: true,
      industryName: true,
    },
  },
  executives: {
    orderBy: { executiveId: 'asc' },
    select: {
      executiveId: true,
      fullName: true,
      position: true,
      startDate: true,
      endDate: true,
    },
  },
} satisfies Prisma.CompanySelect;

type CompanyRecord = Prisma.CompanyGetPayload<{
  select: typeof companyProfileSelect;
}>;

const newsArticleSelect = {
  articleId: true,
  title: true,
  summary: true,
  publishedAt: true,
  url: true,
  source: { select: { sourceName: true } },
  companies: {
    orderBy: { companyId: 'asc' },
    select: {
      company: {
        select: { companyId: true, ticker: true, companyName: true },
      },
    },
  },
} satisfies Prisma.NewsArticleSelect;

type NewsArticleRecord = Prisma.NewsArticleGetPayload<{
  select: typeof newsArticleSelect;
}>;

function toDateString(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function toCompanyProfile(company: CompanyRecord): CompanyProfile {
  return {
    ...company,
    listingDate: toDateString(company.listingDate),
    charterCapital: company.charterCapital?.toString() ?? null,
    executives: company.executives.map((executive) => ({
      ...executive,
      startDate: toDateString(executive.startDate),
      endDate: toDateString(executive.endDate),
    })),
    // Hồ sơ doanh nghiệp chưa có nguồn riêng, không dùng nhầm trích dẫn tài chính.
    citations: [],
  };
}

function invalidPagination(details: string): never {
  throw new BadRequestException({
    statusCode: 400,
    message: 'Invalid pagination',
    data: null,
    error: { code: 'INVALID_PAGINATION', details },
  });
}

function parsePagination(pageValue?: string, limitValue?: string) {
  const parse = (value: string | undefined, fallback: number, name: string) => {
    if (value === undefined) return fallback;
    const parsed = Number(value.trim());
    if (
      !/^\d+$/.test(value.trim()) ||
      !Number.isSafeInteger(parsed) ||
      parsed < 1
    ) {
      invalidPagination(`${name} must be a positive integer`);
    }
    return parsed;
  };
  const page = parse(pageValue, 1, 'Page');
  const limit = parse(limitValue, 10, 'Limit');
  if (limit > 50) invalidPagination('Limit must not exceed 50');
  return { page, limit };
}

function toPlainText(value: string | null): string | null {
  if (!value) return null;
  const text = value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

function toCompanyNewsItem(article: NewsArticleRecord): CompanyNewsItem {
  return {
    articleId: article.articleId,
    sourceName: article.source.sourceName,
    title: article.title,
    summary: toPlainText(article.summary),
    publishedAt: article.publishedAt?.toISOString() ?? null,
    url: article.url,
    companies: article.companies.map(({ company }) => company),
  };
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCompanies(): Promise<ApiResponse<CompanyProfile[]>> {
    const companies = await this.prisma.company.findMany({
      orderBy: { ticker: 'asc' },
      select: companyProfileSelect,
    });

    return {
      statusCode: 200,
      message: 'Fetched companies',
      data: companies.map(toCompanyProfile),
      error: null,
    };
  }

  async findByCompanyCode(
    companyCode: string,
  ): Promise<ApiResponse<CompanyProfile>> {
    const ticker = companyCode.trim().toUpperCase();
    const company = await this.prisma.company.findUnique({
      where: { ticker },
      select: companyProfileSelect,
    });

    if (!company) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Company not found',
        data: null,
        error: {
          code: 'COMPANY_NOT_FOUND',
          details: `Company ${ticker || companyCode} is not available`,
        },
      });
    }

    return {
      statusCode: 200,
      message: 'Fetched company profile',
      data: toCompanyProfile(company),
      error: null,
    };
  }

  findByTicker(ticker: string): Promise<ApiResponse<CompanyProfile>> {
    return this.findByCompanyCode(ticker);
  }

  async getCompanyNews(
    companyCode: string,
    pageValue?: string,
    limitValue?: string,
  ): Promise<ApiResponse<CompanyNewsPage>> {
    const ticker = companyCode.trim().toUpperCase();
    const { page, limit } = parsePagination(pageValue, limitValue);
    const company = await this.prisma.company.findUnique({
      where: { ticker },
      select: { companyId: true },
    });

    if (!company) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Company not found',
        data: null,
        error: {
          code: 'COMPANY_NOT_FOUND',
          details: `Company ${ticker || companyCode} is not available`,
        },
      });
    }

    const where = {
      companies: { some: { companyId: company.companyId } },
    } satisfies Prisma.NewsArticleWhereInput;
    const [articles, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        orderBy: [
          { publishedAt: { sort: 'desc', nulls: 'last' } },
          { articleId: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: newsArticleSelect,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      statusCode: 200,
      message: 'Fetched company news',
      data: {
        items: articles.map(toCompanyNewsItem),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    };
  }
}
