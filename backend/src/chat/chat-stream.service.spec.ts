/// <reference types="jest" />

import { AiService } from '../ai/ai.service';
import type { Citation } from '../common/types/api.types';
import {
  ChatStreamCancelledError,
  ChatStreamService,
} from './chat-stream.service';
import { ChatService, type CreatedUserMessage } from './chat.service';

describe('ChatStreamService', () => {
  const citation: Citation = {
    citationId: 9,
    documentId: 4,
    docTitle: 'Báo cáo FPT',
    sourceUrl: '/api/v1/documents/4/file',
    locationRef: 'Trang 3',
    excerpt: 'Doanh thu tăng trưởng.',
  };
  const userMessage: CreatedUserMessage = {
    messageId: 1,
    role: 'user',
    content: 'Doanh thu FPT thay đổi thế nào?',
    relatedCompany: {
      companyId: 2,
      ticker: 'FPT',
      companyName: 'FPT',
    },
    createdAt: new Date().toISOString(),
    clarification: null,
  };
  const ask = jest.fn();
  const saveAssistantMessage = jest.fn();
  const service = new ChatStreamService(
    { ask } as unknown as AiService,
    { saveAssistantMessage } as unknown as ChatService,
  );

  beforeEach(() => {
    ask.mockReset();
    saveAssistantMessage.mockReset();
  });

  it('emits several deltas, then saves one complete verified answer', async () => {
    const answer = 'FPT ghi nhận doanh thu tăng trưởng ổn định. '.repeat(4);
    ask.mockResolvedValue({
      data: {
        answer,
        isConfident: true,
        citations: [citation],
        limitations: undefined,
      },
    });
    saveAssistantMessage.mockResolvedValue({ messageId: 12 });
    const deltas: string[] = [];

    const result = await service.generate(
      7,
      8,
      userMessage,
      new AbortController().signal,
      (text) => deltas.push(text),
    );

    expect(deltas.length).toBeGreaterThan(1);
    expect(deltas.join('')).toBe(answer);
    expect(saveAssistantMessage).toHaveBeenCalledTimes(1);
    expect(saveAssistantMessage).toHaveBeenCalledWith(7, 8, {
      content: answer,
      relatedCompanyId: 2,
      citationIds: [9],
    });
    expect(result).toEqual({
      assistantMessageId: 12,
      citations: [citation],
      isConfident: true,
      limitations: undefined,
    });
  });

  it('does not save an incomplete answer after cancellation', async () => {
    ask.mockResolvedValue({
      data: {
        answer: 'A'.repeat(100),
        isConfident: false,
        citations: [],
      },
    });
    const controller = new AbortController();

    await expect(
      service.generate(7, 8, userMessage, controller.signal, () => {
        controller.abort();
      }),
    ).rejects.toBeInstanceOf(ChatStreamCancelledError);
    expect(saveAssistantMessage).not.toHaveBeenCalled();
  });

  it('answers with a clarification without calling AI', async () => {
    saveAssistantMessage.mockResolvedValue({ messageId: 13 });
    const clarification = {
      ...userMessage,
      relatedCompany: null,
      clarification: 'Bạn muốn hỏi về doanh nghiệp nào?',
    };
    const deltas: string[] = [];

    const result = await service.generate(
      7,
      8,
      clarification,
      new AbortController().signal,
      (text) => deltas.push(text),
    );

    expect(ask).not.toHaveBeenCalled();
    expect(deltas.join('')).toBe(clarification.clarification);
    expect(saveAssistantMessage).toHaveBeenCalledWith(7, 8, {
      content: clarification.clarification,
      relatedCompanyId: undefined,
      citationIds: [],
    });
    expect(result.assistantMessageId).toBe(13);
  });
});
