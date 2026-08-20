import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import type { AuthenticatedRequest } from '../auth/authenticated.guard';
import {
  ChatStreamService,
  isChatStreamCancelled,
} from './chat-stream.service';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { StreamMessageDto } from './dto/stream-message.dto';

type StreamError = { code: string; message: string };

function streamError(error: unknown): StreamError {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'object' && response !== null) {
      const body = response as {
        message?: unknown;
        error?: { code?: unknown };
      };
      return {
        code:
          typeof body.error?.code === 'string'
            ? body.error.code
            : 'CHAT_STREAM_FAILED',
        message:
          typeof body.message === 'string'
            ? body.message
            : 'Không thể hoàn tất câu trả lời.',
      };
    }
  }
  return {
    code: 'CHAT_STREAM_FAILED',
    message: 'Không thể hoàn tất câu trả lời.',
  };
}

function writeEvent(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

@Controller(['v1/chat', 'chat'])
@UseGuards(AuthenticatedGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatStreamService: ChatStreamService,
  ) {}

  @Post('conversations')
  createConversation(@Req() request: AuthenticatedRequest) {
    return this.chatService.createConversation(request.user.userId);
  }

  @Get('conversations')
  listConversations(@Req() request: AuthenticatedRequest) {
    return this.chatService.listConversations(request.user.userId);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.listMessages(request.user.userId, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  createUserMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateMessageDto,
  ) {
    return this.chatService.createUserMessage(
      request.user.userId,
      conversationId,
      payload.content,
      payload.clientRequestId,
    );
  }

  @Post('conversations/:conversationId/messages/stream')
  async streamMessage(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
    @Body() payload: StreamMessageDto,
  ) {
    // Kiểm tra quyền và lưu câu hỏi trước khi mở kết nối SSE để lỗi HTTP vẫn rõ ràng.
    const created = await this.chatService.createUserMessage(
      request.user.userId,
      conversationId,
      payload.content,
      payload.clientRequestId,
    );

    response.status(200);
    response.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.flushHeaders();

    const abortController = new AbortController();
    response.once('close', () => abortController.abort());
    const heartbeat = setInterval(() => response.write(': ping\n\n'), 15_000);

    writeEvent(response, 'started', {
      userMessageId: created.data?.messageId,
    });

    try {
      const completed = await this.chatStreamService.generate(
        request.user.userId,
        conversationId,
        created.data!,
        abortController.signal,
        (text) => writeEvent(response, 'delta', { text }),
      );
      writeEvent(response, 'completed', completed);
    } catch (error) {
      if (!isChatStreamCancelled(error) && !response.destroyed) {
        writeEvent(response, 'error', streamError(error));
      }
    } finally {
      clearInterval(heartbeat);
      if (!response.destroyed) response.end();
    }
  }
}
