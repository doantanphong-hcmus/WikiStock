import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { ApiResponse, DocumentSummary } from '../common/types/api.types';
import { mockDocuments } from '../common/mock-data/companies';
import { PrismaService } from '../database/prisma.service';

interface RegisteredPdf {
  path: string;
  filename: string;
}

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

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  getDocuments(companyCode: string): ApiResponse<DocumentSummary[]> {
    const normalizedCompanyCode = companyCode.toUpperCase();

    return {
      statusCode: 200,
      message: 'Fetched documents',
      data: mockDocuments[normalizedCompanyCode] ?? [],
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
