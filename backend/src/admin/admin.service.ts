import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { ApiResponse, AdminCompanyStatus } from '../common/types/api.types';
import { PrismaService } from '../database/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';

const documentInclude = {
  company: { select: { companyId: true, ticker: true, companyName: true } },
  source: true,
  documentType: true,
  documentReview: {
    include: {
      reviewer: {
        select: { userId: true, email: true, fullName: true },
      },
    },
  },
} satisfies Prisma.SourceDocumentInclude;

type DocumentRecord = Prisma.SourceDocumentGetPayload<{
  include: typeof documentInclude;
}>;

function mapDocument(document: DocumentRecord) {
  return {
    ...document,
    publishedDate: document.publishedDate?.toISOString() ?? null,
    crawledAt: document.crawledAt.toISOString(),
    documentReview: document.documentReview
      ? {
          ...document.documentReview,
          reviewedAt: document.documentReview.reviewedAt?.toISOString() ?? null,
        }
      : null,
  };
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listCompanies(): Promise<ApiResponse<AdminCompanyStatus[]>> {
    const companies = await this.prisma.company.findMany({
      orderBy: { ticker: 'asc' },
      select: {
        companyId: true,
        ticker: true,
        companyName: true,
        updatedAt: true,
        sourceDocuments: {
          orderBy: { crawledAt: 'desc' },
          take: 1,
          select: { crawledAt: true },
        },
        _count: { select: { sourceDocuments: true } },
      },
    });

    return {
      statusCode: 200,
      message: 'Fetched admin company status',
      data: companies.map((company) => ({
        companyId: company.companyId,
        ticker: company.ticker,
        companyName: company.companyName,
        dataStatus: company._count.sourceDocuments > 0 ? 'ready' : 'draft',
        sourceStatus:
          company._count.sourceDocuments > 0 ? 'available' : 'missing',
        lastUpdated: (
          company.sourceDocuments[0]?.crawledAt ?? company.updatedAt
        ).toISOString(),
      })),
      error: null,
    };
  }

  async listDocuments() {
    const documents = await this.prisma.sourceDocument.findMany({
      include: documentInclude,
      orderBy: { crawledAt: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Fetched source documents',
      data: documents.map(mapDocument),
      error: null,
    };
  }

  async getDocumentOptions() {
    const [companies, sources, documentTypes] = await Promise.all([
      this.prisma.company.findMany({
        orderBy: { ticker: 'asc' },
        select: { companyId: true, ticker: true, companyName: true },
      }),
      this.prisma.dataSource.findMany({ orderBy: { sourceName: 'asc' } }),
      this.prisma.documentType.findMany({ orderBy: { typeName: 'asc' } }),
    ]);

    return {
      statusCode: 200,
      message: 'Fetched document options',
      data: { companies, sources, documentTypes },
      error: null,
    };
  }

  async createDocument(payload: CreateDocumentDto) {
    try {
      const document = await this.prisma.sourceDocument.create({
        data: {
          companyId: payload.companyId,
          sourceId: payload.sourceId,
          docTypeId: payload.docTypeId,
          title: payload.title.trim(),
          publishedDate: payload.publishedDate
            ? new Date(payload.publishedDate)
            : undefined,
          url: payload.url,
          fileRef: payload.fileRef,
          checksum: payload.checksum?.toLowerCase(),
        },
        include: documentInclude,
      });

      return {
        statusCode: 201,
        message: 'Created source document',
        data: mapDocument(document),
        error: null,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Company, source, or document type does not exist',
        );
      }
      throw error;
    }
  }

  async reviewDocument(
    documentId: number,
    reviewerId: number,
    payload: ReviewDocumentDto,
  ) {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { documentId },
      select: { documentId: true },
    });
    if (!document) {
      throw new NotFoundException('Source document not found');
    }

    const reviewedAt = payload.reviewStatus === 'pending' ? null : new Date();
    const review = await this.prisma.documentReview.upsert({
      where: { documentId },
      create: {
        documentId,
        reviewedBy: reviewerId,
        reviewStatus: payload.reviewStatus,
        reviewedAt,
        notes: payload.notes,
      },
      update: {
        reviewedBy: reviewerId,
        reviewStatus: payload.reviewStatus,
        reviewedAt,
        notes: payload.notes,
      },
      include: {
        reviewer: {
          select: { userId: true, email: true, fullName: true },
        },
      },
    });

    return {
      statusCode: 200,
      message: 'Updated document review',
      data: {
        ...review,
        reviewedAt: review.reviewedAt?.toISOString() ?? null,
      },
      error: null,
    };
  }

  async runCitationCheck() {
    const citations = await this.prisma.citation.findMany({
      orderBy: { citationId: 'asc' },
      select: {
        citationId: true,
        excerpt: true,
        locationRef: true,
        document: {
          select: { documentId: true, title: true, url: true, fileRef: true },
        },
      },
    });

    const issues = citations.flatMap((citation) => {
      const citationIssues: Array<{
        citationId: number;
        severity: 'error' | 'warning';
        code: string;
        details: string;
      }> = [];

      if (!citation.document.title.trim()) {
        citationIssues.push({
          citationId: citation.citationId,
          severity: 'error',
          code: 'MISSING_DOCUMENT_TITLE',
          details: `Document ${citation.document.documentId} has no title`,
        });
      }

      if (citation.document.url) {
        try {
          const url = new URL(citation.document.url);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error('Unsupported URL protocol');
          }
        } catch {
          citationIssues.push({
            citationId: citation.citationId,
            severity: 'error',
            code: 'INVALID_SOURCE_URL',
            details: `Document ${citation.document.documentId} has an invalid URL`,
          });
        }
      } else if (!citation.document.fileRef?.trim()) {
        citationIssues.push({
          citationId: citation.citationId,
          severity: 'error',
          code: 'MISSING_SOURCE_REFERENCE',
          details: `Document ${citation.document.documentId} has no URL or file reference`,
        });
      }

      if (!citation.locationRef?.trim()) {
        citationIssues.push({
          citationId: citation.citationId,
          severity: 'warning',
          code: 'MISSING_LOCATION_REFERENCE',
          details: 'Citation has no page, section, or location reference',
        });
      }

      if (!citation.excerpt?.trim()) {
        citationIssues.push({
          citationId: citation.citationId,
          severity: 'warning',
          code: 'MISSING_EXCERPT',
          details: 'Citation has no supporting excerpt',
        });
      }

      return citationIssues;
    });

    const invalidCitationIds = new Set(
      issues
        .filter((issue) => issue.severity === 'error')
        .map((issue) => issue.citationId),
    );

    return {
      statusCode: 200,
      message: 'Completed citation check',
      data: {
        checkedAt: new Date().toISOString(),
        totalCitations: citations.length,
        validCitations: citations.length - invalidCitationIds.size,
        invalidCitations: invalidCitationIds.size,
        warnings: issues.filter((issue) => issue.severity === 'warning').length,
        issues,
      },
      error: null,
    };
  }

  async listUsers() {
    const users = await this.prisma.appUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        userId: true,
        email: true,
        fullName: true,
        createdAt: true,
        role: true,
      },
    });

    return {
      statusCode: 200,
      message: 'Fetched users',
      data: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      })),
      error: null,
    };
  }

  async createUser(payload: CreateUserDto) {
    const role = await this.prisma.userRole.findUnique({
      where: { roleId: payload.roleId },
    });
    if (!role) {
      throw new BadRequestException('Role does not exist');
    }

    try {
      const user = await this.prisma.appUser.create({
        data: {
          email: payload.email.trim().toLowerCase(),
          passwordHash: await hash(payload.password, 12),
          fullName: payload.fullName?.trim(),
          roleId: payload.roleId,
        },
        select: {
          userId: true,
          email: true,
          fullName: true,
          createdAt: true,
          role: true,
        },
      });

      return {
        statusCode: 201,
        message: 'Created user',
        data: { ...user, createdAt: user.createdAt.toISOString() },
        error: null,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async listRoles() {
    return {
      statusCode: 200,
      message: 'Fetched roles',
      data: await this.prisma.userRole.findMany({
        orderBy: { roleName: 'asc' },
      }),
      error: null,
    };
  }

  async updateUserRole(userId: number, roleId: number, actorUserId: number) {
    const [user, role] = await Promise.all([
      this.prisma.appUser.findUnique({
        where: { userId },
        select: { userId: true },
      }),
      this.prisma.userRole.findUnique({ where: { roleId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!role) {
      throw new BadRequestException('Role does not exist');
    }
    if (userId === actorUserId && role.roleName !== 'admin') {
      throw new BadRequestException('Administrators cannot demote themselves');
    }

    const updatedUser = await this.prisma.appUser.update({
      where: { userId },
      data: { roleId },
      select: {
        userId: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return {
      statusCode: 200,
      message: 'Updated user role',
      data: updatedUser,
      error: null,
    };
  }
}
