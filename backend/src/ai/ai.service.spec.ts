/// <reference types="jest" />

import { BadGatewayException } from '@nestjs/common';
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

  afterEach(() => {
    jest.restoreAllMocks();
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
});
