import { HttpException, Injectable } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import { AiRequestCancelledError, AiService } from '../ai/ai.service';
import { Citation } from '../common/types/api.types';
import { ChatService, CreatedUserMessage } from './chat.service';

const DELTA_SIZE = 40;
const DELTA_DELAY_MS = 15;

export class ChatStreamCancelledError extends Error {
  constructor() {
    super('Chat stream was cancelled');
    this.name = 'ChatStreamCancelledError';
  }
}

export interface CompletedChatStream {
  assistantMessageId: number;
  citations: Citation[];
  isConfident: boolean;
  limitations?: string;
}

@Injectable()
export class ChatStreamService {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
  ) {}

  async generate(
    userId: number,
    conversationId: number,
    userMessage: CreatedUserMessage,
    signal: AbortSignal,
    sendDelta: (text: string) => void,
  ): Promise<CompletedChatStream> {
    const company = userMessage.relatedCompany;
    let answer: string;
    let citations: Citation[] = [];
    let isConfident = false;
    let limitations: string | undefined;

    if (userMessage.clarification) {
      answer = userMessage.clarification;
    } else if (company) {
      const response = await this.aiService.ask(
        {
          query: userMessage.content,
          companyCode: company.ticker,
          conversationId: String(conversationId),
        },
        { signal, allowDemoFallback: false },
      );
      if (!response.data) {
        throw new HttpException('AI response has no data', 502);
      }
      answer = response.data.answer;
      citations = response.data.citations;
      isConfident = response.data.isConfident;
      limitations = response.data.limitations;
    } else {
      throw new HttpException('Could not resolve a company', 422);
    }

    for (let offset = 0; offset < answer.length; offset += DELTA_SIZE) {
      this.throwIfCancelled(signal);
      sendDelta(answer.slice(offset, offset + DELTA_SIZE));
      if (offset + DELTA_SIZE < answer.length) {
        await delay(DELTA_DELAY_MS, undefined, { signal }).catch((error) => {
          if (signal.aborted) throw new ChatStreamCancelledError();
          throw error;
        });
      }
    }

    this.throwIfCancelled(signal);
    const saved = await this.chatService.saveAssistantMessage(
      userId,
      conversationId,
      {
        content: answer,
        relatedCompanyId: company?.companyId,
        citationIds: citations.map((citation) => citation.citationId),
      },
    );

    return {
      assistantMessageId: saved.messageId,
      citations,
      isConfident,
      limitations,
    };
  }

  private throwIfCancelled(signal: AbortSignal) {
    if (signal.aborted) {
      throw new ChatStreamCancelledError();
    }
  }
}

export function isChatStreamCancelled(error: unknown) {
  return (
    error instanceof ChatStreamCancelledError ||
    error instanceof AiRequestCancelledError
  );
}
