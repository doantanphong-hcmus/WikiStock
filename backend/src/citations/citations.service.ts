import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { publicDocumentUrl } from '../common/document-url';
import { ApiResponse, Citation } from '../common/types/api.types';
import { PrismaService } from '../database/prisma.service';

const citationSelect = {
  citationId: true,
  documentId: true,
  locationRef: true,
  excerpt: true,
  document: {
    select: {
      documentId: true,
      title: true,
      url: true,
      fileRef: true,
    },
  },
} satisfies Prisma.CitationSelect;

type CitationRecord = Prisma.CitationGetPayload<{
  select: typeof citationSelect;
}>;

function toCitation(record: CitationRecord): Citation | null {
  const sourceUrl = publicDocumentUrl(record.document);
  return sourceUrl
    ? {
        citationId: record.citationId,
        documentId: record.documentId,
        docTitle: record.document.title,
        sourceUrl,
        locationRef: record.locationRef,
        excerpt: record.excerpt,
      }
    : null;
}

@Injectable()
export class CitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCitations(companyCode: string): Promise<ApiResponse<Citation[]>> {
    const ticker = companyCode.trim().toUpperCase();
    const records = await this.prisma.citation.findMany({
      where: {
        document: {
          ingestionStatus: 'ready',
          company: { ticker },
        },
      },
      orderBy: { citationId: 'asc' },
      select: citationSelect,
    });

    return {
      statusCode: 200,
      message: 'Fetched citations',
      data: records
        .map(toCitation)
        .filter((citation): citation is Citation => citation !== null),
      error: null,
    };
  }
}
