import { Injectable, NotFoundException } from '@nestjs/common';
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
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { conversationId, userId },
      select: { conversationId: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

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
}
