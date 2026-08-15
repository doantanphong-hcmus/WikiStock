/// <reference types="jest" />

import { BadGatewayException, GatewayTimeoutException } from '@nestjs/common';
import { mockCitations } from '../common/mock-data/companies';
import { PrismaService } from '../database/prisma.service';
import { AiService } from './ai.service';

function mockAiResponse(data: Record<string, unknown>) {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        statusCode: 200,
        message: 'AI Generated Answer Successfully',
        data,
        error: null,
      }),
  } as Response);
}

describe('AiService', () => {
  const findMany = jest.fn();
  const prisma = { documentChunk: { findMany } };
  const service = new AiService(prisma as unknown as PrismaService);
  const originalDemoMode = process.env.AI_DEMO_MODE;
  const originalTimeout = process.env.AI_SERVICE_TIMEOUT_MS;

  beforeEach(() => {
    delete process.env.AI_DEMO_MODE;
    delete process.env.AI_SERVICE_TIMEOUT_MS;
    findMany.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalDemoMode === undefined) {
      delete process.env.AI_DEMO_MODE;
    } else {
      process.env.AI_DEMO_MODE = originalDemoMode;
    }
    if (originalTimeout === undefined) {
      delete process.env.AI_SERVICE_TIMEOUT_MS;
    } else {
      process.env.AI_SERVICE_TIMEOUT_MS = originalTimeout;
    }
  });

  it('maps internal evidence to the public citation contract', async () => {
    const knownCitation = mockCitations.FPT[0];
    findMany.mockResolvedValue([
      {
        chunkId: 123,
        documentId: knownCitation.documentId,
        content: 'Canonical database excerpt.',
        locationRef: 'Trang 24',
        citation: {
          citationId: knownCitation.citationId,
          documentId: knownCitation.documentId,
          excerpt: 'Canonical database excerpt.',
          locationRef: 'Trang 24',
        },
        document: {
          title: 'Canonical database title',
          url: null,
          fileRef: 'FPT/report.pdf',
          ingestionStatus: 'ready',
          company: { ticker: 'FPT' },
        },
      },
    ]);
    mockAiResponse({
      answer: 'FPT maintained revenue growth.',
      isConfident: true,
      limitations: null,
      evidence: [
        {
          chunkId: 123,
          documentId: knownCitation.documentId,
        },
      ],
    });

    const result = await service.ask({
      companyCode: 'FPT',
      query: 'How did revenue change?',
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.data?.citations).toEqual([
      {
        citationId: knownCitation.citationId,
        documentId: knownCitation.documentId,
        docTitle: 'Canonical database title',
        sourceUrl: `/api/v1/documents/${knownCitation.documentId}/file`,
        locationRef: 'Trang 24',
        excerpt: 'Canonical database excerpt.',
      },
    ]);
  });

  it('rejects evidence that does not match a known source', async () => {
    findMany.mockResolvedValue([]);
    mockAiResponse({
      answer: 'Unsupported answer.',
      isConfident: true,
      limitations: null,
      evidence: [
        {
          chunkId: 999,
          documentId: 999,
        },
      ],
    });

    let thrown: unknown;
    try {
      await service.ask({
        companyCode: 'FPT',
        query: 'Unsupported question',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(BadGatewayException);
    expect((thrown as BadGatewayException).getResponse()).toMatchObject({
      statusCode: 502,
      error: {
        code: 'AI_INVALID_EVIDENCE',
      },
    });
  });

  it('rejects a chunk whose document id does not match the AI evidence', async () => {
    findMany.mockResolvedValue([
      {
        chunkId: 123,
        documentId: 8,
        content: 'Canonical excerpt.',
        locationRef: 'Trang 1',
        citation: {
          citationId: 1,
          documentId: 8,
          excerpt: 'Canonical excerpt.',
          locationRef: 'Trang 1',
        },
        document: {
          title: 'FPT report',
          url: null,
          fileRef: 'FPT/report.pdf',
          ingestionStatus: 'ready',
          company: { ticker: 'FPT' },
        },
      },
    ]);
    mockAiResponse({
      answer: 'Mismatched answer.',
      isConfident: true,
      limitations: null,
      evidence: [{ chunkId: 123, documentId: 9 }],
    });

    await expect(
      service.ask({ companyCode: 'FPT', query: 'Question' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('preserves AI evidence order while querying unique chunks once', async () => {
    const makeChunk = (chunkId: number, citationId: number) => ({
      chunkId,
      documentId: 8,
      content: `Excerpt ${chunkId}`,
      locationRef: `Trang ${chunkId}`,
      citation: {
        citationId,
        documentId: 8,
        excerpt: `Excerpt ${chunkId}`,
        locationRef: `Trang ${chunkId}`,
      },
      document: {
        title: 'FPT report',
        url: 'https://example.com/report.pdf',
        fileRef: null,
        ingestionStatus: 'ready',
        company: { ticker: 'FPT' },
      },
    });
    findMany.mockResolvedValue([makeChunk(2, 20), makeChunk(1, 10)]);
    mockAiResponse({
      answer: 'Ordered answer.',
      isConfident: true,
      limitations: null,
      evidence: [
        { chunkId: 1, documentId: 8 },
        { chunkId: 2, documentId: 8 },
        { chunkId: 1, documentId: 8 },
      ],
    });

    const result = await service.ask({ companyCode: 'FPT', query: 'Question' });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0].where.chunkId.in).toEqual([1, 2]);
    expect(result.data?.citations.map((item) => item.citationId)).toEqual([
      10, 20, 10,
    ]);
  });

  it('rejects a confident answer without evidence', async () => {
    mockAiResponse({
      answer: 'Unsupported confident answer.',
      isConfident: true,
      limitations: null,
      evidence: [],
    });

    await expect(
      service.ask({
        companyCode: 'FPT',
        query: 'Confident question',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects a response without answer and confidence fields', async () => {
    mockAiResponse({
      limitations: null,
      evidence: [],
    });

    let thrown: unknown;
    try {
      await service.ask({
        companyCode: 'FPT',
        query: 'Malformed response question',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(BadGatewayException);
    expect((thrown as BadGatewayException).getResponse()).toMatchObject({
      statusCode: 502,
      error: {
        code: 'AI_INVALID_RESPONSE',
      },
    });
  });

  it('returns 504 when AI service times out', async () => {
    const timeoutError = new Error('Timed out');
    timeoutError.name = 'TimeoutError';
    jest.spyOn(global, 'fetch').mockRejectedValue(timeoutError);

    await expect(
      service.ask({
        companyCode: 'FPT',
        query: 'Timeout question',
      }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('applies the configured AI service timeout', async () => {
    process.env.AI_SERVICE_TIMEOUT_MS = '12345';
    const timeout = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(AbortSignal.abort());
    mockAiResponse({
      answer: 'Not enough evidence.',
      isConfident: false,
      limitations: 'No evidence.',
      evidence: [],
    });

    await service.ask({ companyCode: 'FPT', query: 'Question' });

    expect(timeout).toHaveBeenCalledWith(12345);
  });

  it('returns 502 when AI service returns an HTTP error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    let thrown: unknown;
    try {
      await service.ask({
        companyCode: 'FPT',
        query: 'Upstream error question',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(BadGatewayException);
    expect((thrown as BadGatewayException).getResponse()).toMatchObject({
      statusCode: 502,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
      },
    });
  });

  it('uses mock fallback only when demo mode is enabled', async () => {
    process.env.AI_DEMO_MODE = 'true';
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Offline'));

    const result = await service.ask({
      companyCode: 'FPT',
      query: 'Demo question',
    });

    expect(result.statusCode).toBe(200);
    expect(result.message).toContain('fallback demo');
    expect(result.data?.isConfident).toBe(false);
    expect(result.data?.citations).toEqual(mockCitations.FPT);
  });
});
