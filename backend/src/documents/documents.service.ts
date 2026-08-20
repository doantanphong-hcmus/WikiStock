import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { publicDocumentUrl } from '../common/document-url';
import { ApiResponse, DocumentSummary } from '../common/types/api.types';
import { PrismaService } from '../database/prisma.service';

interface RegisteredPdf {
  path: string;
  filename: string;
}

const documentSelect = {
  documentId: true,
  companyId: true,
  title: true,
  publishedDate: true,
  url: true,
  fileRef: true,
  crawledAt: true,
  checksum: true,
  source: {
    select: {
      sourceId: true,
      sourceName: true,
      sourceType: true,
      reliabilityTier: true,
      costTier: true,
      accessUrl: true,
    },
  },
  documentType: { select: { docTypeId: true, typeName: true } },
} satisfies Prisma.SourceDocumentSelect;

type DocumentRecord = Prisma.SourceDocumentGetPayload<{
  select: typeof documentSelect;
}>;

function isInside(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return (
    pathFromRoot !== '..' &&
    !pathFromRoot.startsWith(
      `..${process.platform === 'win32' ? '\\' : '/'}`,
    ) &&
    !isAbsolute(pathFromRoot)
  );
}

function toDocumentSummary(document: DocumentRecord): DocumentSummary {
  return {
    ...document,
    publishedDate: document.publishedDate?.toISOString().slice(0, 10) ?? null,
    url: publicDocumentUrl(document),
    crawledAt: document.crawledAt.toISOString(),
  };
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDocuments(
    companyCode: string,
  ): Promise<ApiResponse<DocumentSummary[]>> {
    const ticker = companyCode.trim().toUpperCase();
    const company = await this.prisma.company.findUnique({
      where: { ticker },
      select: {
        sourceDocuments: {
          where: { ingestionStatus: 'ready' },
          orderBy: [{ publishedDate: 'desc' }, { documentId: 'desc' }],
          select: documentSelect,
        },
      },
    });

    return {
      statusCode: 200,
      message: 'Fetched documents',
      data: company?.sourceDocuments.map(toDocumentSummary) ?? [],
      error: null,
    };
  }

  async getRegisteredPdf(documentId: number): Promise<RegisteredPdf> {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { documentId },
      select: {
        documentId: true,
        title: true,
        fileRef: true,
        ingestionStatus: true,
      },
    });
    if (
      !document ||
      document.ingestionStatus !== 'ready' ||
      !document.fileRef?.trim()
    ) {
      throw new NotFoundException('Document PDF not found');
    }

    try {
      const root = await fs.realpath(
        resolve(process.env.SEED_DATA_PATH ?? '/data/seed_data'),
      );
      const candidate = resolve(root, document.fileRef);
      if (!isInside(root, candidate)) {
        throw new NotFoundException('Document PDF not found');
      }

      const filePath = await fs.realpath(candidate);
      const file = await fs.stat(filePath);
      if (
        !isInside(root, filePath) ||
        !file.isFile() ||
        extname(filePath).toLowerCase() !== '.pdf'
      ) {
        throw new NotFoundException('Document PDF not found');
      }

      return {
        path: filePath,
        filename: `${document.title.trim() || `document-${documentId}`}.pdf`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Document PDF not found');
    }
  }
}
