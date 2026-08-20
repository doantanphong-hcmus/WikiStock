import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import {
  AiAskRequest,
  AiAskResponse,
  ApiResponse,
  Citation,
} from '../common/types/api.types';
import { mockCitations } from '../common/mock-data/companies';
import { publicDocumentUrl } from '../common/document-url';
import { PrismaService } from '../database/prisma.service';

type JsonObject = Record<string, unknown>;

export interface AiAskOptions {
  signal?: AbortSignal;
  allowDemoFallback?: boolean;
}

export class AiRequestCancelledError extends Error {
  constructor() {
    super('AI request was cancelled');
    this.name = 'AiRequestCancelledError';
  }
}

function asObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function invalidEvidence(details: string) {
  return new BadGatewayException({
    statusCode: 502,
    message: 'AI service returned invalid citation evidence',
    data: null,
    error: {
      code: 'AI_INVALID_EVIDENCE',
      details,
    },
  });
}

function invalidResponse(details: string) {
  return new BadGatewayException({
    statusCode: 502,
    message: 'AI service returned an invalid response',
    data: null,
    error: {
      code: 'AI_INVALID_RESPONSE',
      details,
    },
  });
}

function serviceUnavailable(details: string) {
  return new BadGatewayException({
    statusCode: 502,
    message: 'AI service is unavailable',
    data: null,
    error: {
      code: 'AI_SERVICE_UNAVAILABLE',
      details,
    },
  });
}

function serviceTimeout(timeoutMs: number) {
  return new GatewayTimeoutException({
    statusCode: 504,
    message: 'AI service timed out',
    data: null,
    error: {
      code: 'AI_SERVICE_TIMEOUT',
      details: `AI service did not respond within ${timeoutMs}ms`,
    },
  });
}

function aiServiceTimeoutMs(): number {
  const configured = Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 60_000);
  return Number.isInteger(configured) && configured > 0 ? configured : 60_000;
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  private async mapEvidence(
    companyCode: string,
    value: unknown,
  ): Promise<Citation[]> {
    if (!Array.isArray(value)) {
      throw invalidEvidence('The evidence field must be an array');
    }

    const evidence = value.map((rawEvidence, index) => {
      const evidence = asObject(rawEvidence);
      const chunkId = evidence?.chunkId;
      const documentId = evidence?.documentId;

      if (
        !Number.isInteger(chunkId) ||
        Number(chunkId) <= 0 ||
        !Number.isInteger(documentId) ||
        Number(documentId) <= 0
      ) {
        throw invalidEvidence(`Evidence at index ${index} has invalid fields`);
      }

      return { chunkId: Number(chunkId), documentId: Number(documentId) };
    });

    const chunkIds = [...new Set(evidence.map((item) => item.chunkId))];
    if (chunkIds.length === 0) {
      return [];
    }

    const chunks = await this.prisma.documentChunk.findMany({
      where: { chunkId: { in: chunkIds } },
      select: {
        chunkId: true,
        documentId: true,
        content: true,
        locationRef: true,
        citation: {
          select: {
            citationId: true,
            documentId: true,
            excerpt: true,
            locationRef: true,
          },
        },
        document: {
          select: {
            title: true,
            url: true,
            fileRef: true,
            ingestionStatus: true,
            company: { select: { ticker: true } },
          },
        },
      },
    });
    if (chunks.length !== chunkIds.length) {
      throw invalidEvidence('Evidence references an unknown chunk');
    }

    const chunksById = new Map(chunks.map((chunk) => [chunk.chunkId, chunk]));
    return evidence.map(({ chunkId, documentId }, index) => {
      const chunk = chunksById.get(chunkId);
      if (
        !chunk ||
        chunk.documentId !== documentId ||
        chunk.document.ingestionStatus !== 'ready' ||
        chunk.document.company?.ticker !== companyCode
      ) {
        throw invalidEvidence(
          `Evidence at index ${index} does not match a ready company document`,
        );
      }

      const citation = chunk.citation;
      if (!citation || citation.documentId !== documentId) {
        throw invalidEvidence(
          `Evidence at index ${index} has no canonical citation`,
        );
      }
      const sourceUrl = publicDocumentUrl({
        documentId,
        url: chunk.document.url,
        fileRef: chunk.document.fileRef,
      });
      if (!sourceUrl) {
        throw invalidEvidence(
          `Evidence at index ${index} has no registered source`,
        );
      }

      return {
        citationId: citation.citationId,
        documentId,
        docTitle: chunk.document.title,
        sourceUrl,
        locationRef: citation.locationRef ?? chunk.locationRef,
        excerpt: citation.excerpt ?? chunk.content,
      };
    });
  }

  private demoFallback(companyCode: string): ApiResponse<AiAskResponse> {
    return {
      statusCode: 200,
      message: 'AI service unavailable, using fallback demo response',
      data: {
        answer: `AI service chưa khả dụng trong môi trường local. Đây là phản hồi demo cho ${companyCode || 'mã cổ phiếu đã chọn'}.`,
        isConfident: false,
        citations: mockCitations[companyCode] ?? [],
        limitations:
          'AI service chưa chạy hoặc không phản hồi đúng hạn. Dữ liệu hiện tại là mock/demo.',
      },
      error: null,
    };
  }

  async ask(
    payload: AiAskRequest,
    options: AiAskOptions = {},
  ): Promise<ApiResponse<AiAskResponse>> {
    const baseUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';
    const demoMode =
      process.env.AI_DEMO_MODE === 'true' &&
      options.allowDemoFallback !== false;
    const timeoutMs = aiServiceTimeoutMs();
    const companyCode = (
      payload.companyCode ??
      payload.ticker ??
      ''
    ).toUpperCase();
    const query = payload.query ?? payload.question ?? '';

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/v1/internal/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          companyCode,
          filters: payload.filters,
          conversationId: payload.conversationId,
        }),
        signal,
      });
    } catch (error) {
      if (options.signal?.aborted) {
        throw new AiRequestCancelledError();
      }

      if (demoMode) {
        return this.demoFallback(companyCode);
      }

      if (isTimeoutError(error)) {
        throw serviceTimeout(timeoutMs);
      }

      throw serviceUnavailable('Could not connect to AI service');
    }

    if (!response.ok) {
      if (demoMode) {
        return this.demoFallback(companyCode);
      }

      throw serviceUnavailable(`AI service returned HTTP ${response.status}`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw invalidResponse('AI service response is not valid JSON');
    }

    const envelope = asObject(body);
    const data = asObject(envelope?.data ?? body);
    if (!data) {
      throw invalidResponse('AI service response data must be an object');
    }

    if (
      typeof data.answer !== 'string' ||
      !data.answer.trim() ||
      typeof data.isConfident !== 'boolean'
    ) {
      throw invalidResponse('Answer and confidence fields are required');
    }

    const citations = await this.mapEvidence(companyCode, data.evidence);
    const isConfident = data.isConfident;

    if (isConfident && citations.length === 0) {
      throw invalidEvidence(
        'A confident financial answer must include evidence',
      );
    }

    return {
      statusCode: 200,
      message: 'AI Generated Answer Successfully',
      data: {
        answer: data.answer,
        isConfident,
        citations,
        limitations:
          typeof data.limitations === 'string'
            ? data.limitations
            : isConfident
              ? undefined
              : 'Kết quả được trả về từ ai-service local, chưa kết nối dữ liệu thật.',
      },
      error: null,
    };
  }
}
