import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiResponse, FinancialSummary } from '../common/types/api.types';
import { PrismaService } from '../database/prisma.service';

const financialReportSelect = {
  reportId: true,
  companyId: true,
  periodType: true,
  fiscalYear: true,
  fiscalQuarter: true,
  reportDate: true,
  lineItems: {
    orderBy: [
      { metric: { statementType: 'asc' } },
      { metric: { metricCode: 'asc' } },
      { lineItemId: 'asc' },
    ],
    select: {
      lineItemId: true,
      value: true,
      metric: {
        select: {
          metricId: true,
          metricCode: true,
          metricName: true,
          unit: true,
          statementType: true,
        },
      },
    },
  },
} satisfies Prisma.FinancialReportSelect;

type FinancialReportRecord = Prisma.FinancialReportGetPayload<{
  select: typeof financialReportSelect;
}>;

function invalidPeriod(details: string): never {
  throw new BadRequestException({
    statusCode: 400,
    message: 'Invalid financial period',
    data: null,
    error: { code: 'INVALID_FINANCIAL_PERIOD', details },
  });
}

function parsePeriod(year?: string, quarter?: string) {
  const normalizedYear = year?.trim();
  const normalizedQuarter = quarter?.trim();
  let fiscalYear: number | undefined;
  let fiscalQuarter: number | undefined;

  if (normalizedYear !== undefined) {
    if (!/^\d{4}$/.test(normalizedYear)) {
      invalidPeriod('Year must be an integer from 1900 to 9999');
    }
    fiscalYear = Number(normalizedYear);
    if (fiscalYear < 1900) {
      invalidPeriod('Year must be an integer from 1900 to 9999');
    }
  }

  if (normalizedQuarter !== undefined) {
    if (fiscalYear === undefined) {
      invalidPeriod('Quarter requires a year');
    }
    if (!/^[1-4]$/.test(normalizedQuarter)) {
      invalidPeriod('Quarter must be an integer from 1 to 4');
    }
    fiscalQuarter = Number(normalizedQuarter);
  }

  return { fiscalYear, fiscalQuarter };
}

function toFinancialSummary(
  report: FinancialReportRecord,
  ticker: string,
): FinancialSummary {
  return {
    ...report,
    ticker,
    periodType: report.periodType as FinancialSummary['periodType'],
    reportDate: report.reportDate?.toISOString().slice(0, 10) ?? null,
    lineItems: report.lineItems.map((lineItem) => ({
      ...lineItem,
      value: lineItem.value.toString(),
    })),
  };
}

@Injectable()
export class FinancialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancials(
    companyCode: string,
    year?: string,
    quarter?: string,
  ): Promise<ApiResponse<FinancialSummary>> {
    const ticker = companyCode.trim().toUpperCase();
    const { fiscalYear, fiscalQuarter } = parsePeriod(year, quarter);
    const company = await this.prisma.company.findUnique({
      where: { ticker },
      select: { companyId: true, ticker: true },
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

    const financial = await this.prisma.financialReport.findFirst({
      where: {
        companyId: company.companyId,
        fiscalYear,
        fiscalQuarter,
      },
      orderBy: [
        { fiscalYear: 'desc' },
        { fiscalQuarter: { sort: 'desc', nulls: 'last' } },
        { reportDate: { sort: 'desc', nulls: 'last' } },
        { reportId: 'desc' },
      ],
      select: financialReportSelect,
    });

    if (!financial) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Financials not found',
        data: null,
        error: {
          code: 'FINANCIALS_NOT_FOUND',
          details: `Company ${ticker} has no financial data for the requested period`,
        },
      });
    }

    return {
      statusCode: 200,
      message: 'Fetched financial data',
      data: toFinancialSummary(financial, company.ticker),
      error: null,
    };
  }
}
