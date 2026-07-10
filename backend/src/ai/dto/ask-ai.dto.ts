import { IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';

export class AskAiDto {
  @ValidateIf((payload: AskAiDto) => !payload.question)
  @IsString()
  query?: string;

  @ValidateIf((payload: AskAiDto) => !payload.query)
  @IsString()
  question?: string;

  @ValidateIf((payload: AskAiDto) => !payload.ticker)
  @IsString()
  companyCode?: string;

  @ValidateIf((payload: AskAiDto) => !payload.companyCode)
  @IsString()
  ticker?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}
