import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatStreamService } from './chat-stream.service';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [ChatController],
  providers: [ChatService, ChatStreamService],
  exports: [ChatService],
})
export class ChatModule {}
