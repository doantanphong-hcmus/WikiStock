import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiResponse, Citation } from '../common/types/api.types';
import { publicDocumentUrl } from '../common/document-url';
import { PrismaService } from '../database/prisma.service';

const CONVERSATION_LIMIT = 50;
const MESSAGE_LIMIT = 200;
const DEFAULT_TITLE = 'Cuộc trò chuyện mới';

interface ConversationRow {
  conversationId: number;
  startedAt: Date;
  updatedAt: Date;
  firstUserMessage: string | null;
  messageCount: number;
}

export interface ConversationSummary {
  conversationId: number;
  title: string;
  startedAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface MessageCompany {
  companyId: number;
  ticker: string;
  companyName: string;
}

export interface CreatedUserMessage {
  messageId: number;
  role: 'user';
  content: string;
  relatedCompany: MessageCompany | null;
  createdAt: string;
  clarification: string | null;
}

export interface SaveAssistantMessageInput {
  content: string;
  relatedCompanyId?: number | null;
  modelUsed?: string | null;
  citationIds?: number[];
}

function conversationTitle(content: string | null): string {
  const title = content?.trim() || DEFAULT_TITLE;
  return title.length > 80 ? `${title.slice(0, 77)}...` : title;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(
    userId: number,
  ): Promise<ApiResponse<ConversationSummary>> {
    const conversation = await this.prisma.aiConversation.create({
      data: { userId },
    });
    const startedAt = conversation.startedAt.toISOString();

    return {
      statusCode: 201,
      message: 'Created conversation',
      data: {
        conversationId: conversation.conversationId,
        title: DEFAULT_TITLE,
        startedAt,
        updatedAt: startedAt,
        messageCount: 0,
      },
      error: null,
    };
  }

  async listConversations(
    userId: number,
  ): Promise<ApiResponse<ConversationSummary[]>> {
    // Tiêu đề lấy từ câu hỏi đầu tiên; thứ tự lấy theo tin nhắn mới nhất.
    const rows = await this.prisma.$queryRaw<ConversationRow[]>(Prisma.sql`
      SELECT
        conversation.conversation_id AS "conversationId",
        conversation.started_at AS "startedAt",
        COALESCE(MAX(message.created_at), conversation.started_at) AS "updatedAt",
        (
          SELECT first_message.content
          FROM ai_message AS first_message
          WHERE first_message.conversation_id = conversation.conversation_id
            AND first_message.role = 'user'
          ORDER BY first_message.created_at ASC, first_message.message_id ASC
          LIMIT 1
        ) AS "firstUserMessage",
        COUNT(message.message_id)::int AS "messageCount"
      FROM ai_conversation AS conversation
      LEFT JOIN ai_message AS message
        ON message.conversation_id = conversation.conversation_id
      WHERE conversation.user_id = ${userId}
      GROUP BY conversation.conversation_id, conversation.started_at
      ORDER BY "updatedAt" DESC, conversation.conversation_id DESC
      LIMIT ${CONVERSATION_LIMIT}
    `);

    return {
      statusCode: 200,
      message: 'Fetched conversations',
      data: rows.map((row) => ({
        conversationId: row.conversationId,
        title: conversationTitle(row.firstUserMessage),
        startedAt: row.startedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        messageCount: row.messageCount,
      })),
      error: null,
    };
  }

  async listMessages(userId: number, conversationId: number) {
    await this.requireConversation(userId, conversationId);
    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { messageId: 'desc' }],
      take: MESSAGE_LIMIT,
      include: {
        relatedCompany: {
          select: { companyId: true, ticker: true, companyName: true },
        },
        citations: {
          include: {
            citation: {
              include: {
                document: {
                  select: {
                    documentId: true,
                    title: true,
                    url: true,
                    fileRef: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      statusCode: 200,
      message: 'Fetched conversation messages',
      data: messages.reverse().map((message) => ({
        messageId: message.messageId,
        role: message.role,
        content: message.content,
        relatedCompany: message.relatedCompany,
        modelUsed: message.modelUsed,
        createdAt: message.createdAt.toISOString(),
        citations: message.citations.flatMap(({ citation }) => {
          const sourceUrl = publicDocumentUrl(citation.document);
          return sourceUrl
            ? [
                {
                  citationId: citation.citationId,
                  documentId: citation.documentId,
                  docTitle: citation.document.title,
                  sourceUrl,
                  locationRef: citation.locationRef,
                  excerpt: citation.excerpt,
                } satisfies Citation,
              ]
            : [];
        }),
      })),
      error: null,
    };
  }

  async createUserMessage(
    userId: number,
    conversationId: number,
    content: string,
    clientRequestId?: string,
  ): Promise<ApiResponse<CreatedUserMessage>> {
    await this.requireConversation(userId, conversationId);
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message content is required');
    }

    const relatedCompany = await this.resolveCompany(
      userId,
      conversationId,
      normalizedContent,
    );
    const message = clientRequestId
      ? await this.prisma.aiMessage.upsert({
          where: {
            conversationId_clientRequestId: {
              conversationId,
              clientRequestId,
            },
          },
          create: {
            conversationId,
            clientRequestId,
            role: 'user',
            content: normalizedContent,
            relatedCompanyId: relatedCompany?.companyId,
          },
          update: {},
          include: {
            relatedCompany: {
              select: { companyId: true, ticker: true, companyName: true },
            },
          },
        })
      : await this.prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'user',
            content: normalizedContent,
            relatedCompanyId: relatedCompany?.companyId,
          },
          include: {
            relatedCompany: {
              select: { companyId: true, ticker: true, companyName: true },
            },
          },
        });

    if (message.role !== 'user' || message.content !== normalizedContent) {
      throw new ConflictException(
        'clientRequestId was already used for another message',
      );
    }

    return {
      statusCode: 201,
      message: 'Created user message',
      data: {
        messageId: message.messageId,
        role: 'user',
        content: message.content,
        relatedCompany: message.relatedCompany,
        createdAt: message.createdAt.toISOString(),
        clarification: message.relatedCompany
          ? null
          : 'Bạn muốn hỏi về doanh nghiệp nào?',
      },
      error: null,
    };
  }

  // D3 chỉ gọi hàm này sau khi AI đã trả lời hoàn chỉnh.
  async saveAssistantMessage(
    userId: number,
    conversationId: number,
    input: SaveAssistantMessageInput,
  ) {
    await this.requireConversation(userId, conversationId);
    const content = input.content.trim();
    if (!content) {
      throw new BadRequestException('Assistant message content is required');
    }

    const citationIds = [...new Set(input.citationIds ?? [])];
    const message = await this.prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content,
        relatedCompanyId: input.relatedCompanyId,
        modelUsed: input.modelUsed,
        citations: {
          create: citationIds.map((citationId) => ({ citationId })),
        },
      },
      select: { messageId: true, createdAt: true },
    });

    return {
      messageId: message.messageId,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private async requireConversation(userId: number, conversationId: number) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { conversationId, userId },
      select: { conversationId: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private async resolveCompany(
    userId: number,
    conversationId: number,
    content: string,
  ): Promise<MessageCompany | null> {
    // Chỉ nhận mã độc lập có thật trong database, không suy đoán bằng AI.
    const tokens = [
      ...new Set(content.toUpperCase().match(/[A-Z0-9]{1,10}/g) ?? []),
    ];
    if (tokens.length > 0) {
      const companies = await this.prisma.company.findMany({
        where: { ticker: { in: tokens } },
        select: { companyId: true, ticker: true, companyName: true },
      });
      const companiesByTicker = new Map(
        companies.map((company) => [company.ticker, company]),
      );
      const currentCompany = tokens
        .map((token) => companiesByTicker.get(token))
        .find((company) => company !== undefined);
      if (currentCompany) return currentCompany;
    }

    const previousMessage = await this.prisma.aiMessage.findFirst({
      where: {
        conversationId,
        relatedCompanyId: { not: null },
        conversation: { userId },
      },
      orderBy: [{ createdAt: 'desc' }, { messageId: 'desc' }],
      select: {
        relatedCompany: {
          select: { companyId: true, ticker: true, companyName: true },
        },
      },
    });
    return previousMessage?.relatedCompany ?? null;
  }
}
