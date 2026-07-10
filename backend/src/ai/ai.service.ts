import { Injectable } from '@nestjs/common';
import {
  AiAskRequest,
  AiAskResponse,
  ApiResponse,
} from '../common/types/api.types';
import { mockCitations } from '../common/mock-data/companies';

@Injectable()
export class AiService {
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

      const body = (await response.json()) as Partial<
        ApiResponse<Partial<AiAskResponse>>
      > &
        Partial<AiAskResponse>;
      const data = body.data ?? body;

      return {
        statusCode: 200,
        message: 'AI Generated Answer Successfully',
        data: {
          answer: data.answer ?? 'Không có câu trả lời từ AI service.',
          isConfident: data.isConfident ?? false,
          citations: data.citations ?? [],
          limitations:
            data.limitations ??
            'Kết quả được trả về từ ai-service local, chưa kết nối dữ liệu thật.',
        },
        error: null,
      };
    } catch {
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
