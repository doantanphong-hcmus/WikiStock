/// <reference types="jest" />

import { BadGatewayException, GatewayTimeoutException } from '@nestjs/common';
import { mockCitations } from '../common/mock-data/companies';
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
  const service = new AiService();
  const originalDemoMode = process.env.AI_DEMO_MODE;

  beforeEach(() => {
    delete process.env.AI_DEMO_MODE;
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
  });

  it('maps internal evidence to the public citation contract', async () => {
    const knownCitation = mockCitations.FPT[0];
    mockAiResponse({
      answer: 'FPT maintained revenue growth.',
      isConfident: true,
      limitations: null,
      evidence: [
        {
          documentId: knownCitation.documentId,
          locationRef: knownCitation.locationRef,
          excerpt: knownCitation.excerpt,
        },
      ],
    });

    const result = await service.ask({
      companyCode: 'FPT',
      query: 'How did revenue change?',
    });

    expect(result.data?.citations).toEqual([knownCitation]);
  });

  it('rejects evidence that does not match a known source', async () => {
    mockAiResponse({
      answer: 'Unsupported answer.',
      isConfident: true,
      limitations: null,
      evidence: [
        {
          documentId: 999,
          locationRef: 'Page 1',
          excerpt: 'Unknown source.',
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
