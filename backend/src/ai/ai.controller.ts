import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskAiDto } from './dto/ask-ai.dto';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(['v1/ai/ask', 'ai/ask'])
  @HttpCode(200)
  ask(@Body() body: AskAiDto) {
    return this.aiService.ask(body);
  }
}
