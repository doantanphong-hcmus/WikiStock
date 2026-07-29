import { BadGatewayException, Injectable } from '@nestjs/common';
import {
  AiAskRequest,
  AiAskResponse,
  ApiResponse,
  Citation,
} from '../common/types/api.types';
import { mockCitations, mockDocuments } from '../common/mock-data/companies';

type JsonObject = Record<string, unknown>;

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

@Injectable()
export class AiService {
  private mapEvidence(companyCode: string, value: unknown): Citation[] {
    if (!Array.isArray(value)) {
      throw invalidEvidence('The evidence field must be an array');
    }

    const documents = mockDocuments[companyCode] ?? [];
    const citations = mockCitations[companyCode] ?? [];

    // ponytail: mock lookup only; replace with one Prisma create-or-get query when persistence is wired.
    return value.map((rawEvidence, index) => {
      const evidence = asObject(rawEvidence);
      const documentId = evidence?.documentId;
      const locationRef = evidence?.locationRef;
      const excerpt = evidence?.excerpt;

      if (
        !Number.isInteger(documentId) ||
        Number(documentId) <= 0 ||
        (locationRef !== null && typeof locationRef !== 'string') ||
        typeof excerpt !== 'string' ||
        !excerpt.trim()
      ) {
        throw invalidEvidence(`Evidence at index ${index} has invalid fields`);
      }

      const document = documents.find((item) => item.documentId === documentId);
      const citation = citations.find(
        (item) =>
          item.documentId === documentId &&
          item.locationRef === locationRef &&
          item.excerpt === excerpt,
      );

      if (!document || !citation) {
        throw invalidEvidence(
          `Evidence at index ${index} does not match a known source`,
        );
      }

      return {
        citationId: citation.citationId,
        documentId: document.documentId,
        docTitle: document.title,
        sourceUrl: document.url,
        locationRef,
        excerpt,
      };
    });
  }

  async ask(payload: AiAskRequest): Promise<ApiResponse<AiAskResponse>> {
    const baseUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';
    const companyCode = (
      payload.companyCode ??
      payload.ticker ??
      ''
    ).toUpperCase();
    const query = payload.query ?? payload.question ?? '';

    try {
      const response = await fetch(`${baseUrl}/api/v1/internal/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          companyCode,
          filters: payload.filters,
          conversationId: payload.conversationId,
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw invalidEvidence('AI service response is not valid JSON');
      }

      const envelope = asObject(body);
      const data = asObject(envelope?.data ?? body);
      if (!data) {
        throw invalidEvidence('AI service response data must be an object');
      }

      const citations = this.mapEvidence(companyCode, data.evidence);
      const isConfident = data.isConfident === true;

      if (isConfident && citations.length === 0) {
        throw invalidEvidence(
          'A confident financial answer must include evidence',
        );
      }

      return {
        statusCode: 200,
        message: 'AI Generated Answer Successfully',
        data: {
          answer:
            typeof data.answer === 'string'
              ? data.answer
              : 'Không có câu trả lời từ AI service.',
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
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

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
  }
}
