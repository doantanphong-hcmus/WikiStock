/// <reference types="jest" />

import { NotFoundException } from '@nestjs/common';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const findUnique = jest.fn();
  const prisma = { sourceDocument: { findUnique } };
  const service = new DocumentsService(prisma as unknown as PrismaService);
  const originalSeedPath = process.env.SEED_DATA_PATH;
  let workspace: string;
  let seedRoot: string;

  beforeEach(async () => {
    findUnique.mockReset();
    workspace = await mkdtemp(join(tmpdir(), 'wikistock-documents-'));
    seedRoot = join(workspace, 'seed');
    await mkdir(seedRoot);
    process.env.SEED_DATA_PATH = seedRoot;
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  afterAll(() => {
    if (originalSeedPath === undefined) {
      delete process.env.SEED_DATA_PATH;
    } else {
      process.env.SEED_DATA_PATH = originalSeedPath;
    }
  });

  function register(fileRef: string, ingestionStatus = 'ready') {
    findUnique.mockResolvedValue({
      documentId: 8,
      title: 'FPT annual report',
      fileRef,
      ingestionStatus,
    });
  }

  it('returns a registered ready PDF under the configured seed root', async () => {
    const companyDirectory = join(seedRoot, 'FPT');
    await mkdir(companyDirectory);
    const pdfPath = join(companyDirectory, 'report.pdf');
    await writeFile(pdfPath, '%PDF-test');
    register('FPT/report.pdf');

    await expect(service.getRegisteredPdf(8)).resolves.toEqual({
      path: pdfPath,
      filename: 'FPT annual report.pdf',
    });
  });

  it('rejects path traversal and non-ready documents', async () => {
    const outside = join(workspace, 'outside.pdf');
    await writeFile(outside, '%PDF-test');
    register('../outside.pdf');
    await expect(service.getRegisteredPdf(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    register('FPT/report.pdf', 'pending');
    await expect(service.getRegisteredPdf(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a symlink that escapes the configured seed root', async () => {
    const outsideDirectory = join(workspace, 'outside');
    await mkdir(outsideDirectory);
    await writeFile(join(outsideDirectory, 'report.pdf'), '%PDF-test');
    const link = join(seedRoot, 'linked');
    try {
      await symlink(outsideDirectory, link, 'junction');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        return;
      }
      throw error;
    }
    register('linked/report.pdf');

    await expect(service.getRegisteredPdf(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
