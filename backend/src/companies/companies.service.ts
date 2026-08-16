import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiResponse, CompanyProfile } from '../common/types/api.types';
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
}
