import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import type { AuthenticatedRequest } from '../auth/authenticated.guard';
import { ChatService } from './chat.service';

@Controller(['v1/chat', 'chat'])
@UseGuards(AuthenticatedGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
}
