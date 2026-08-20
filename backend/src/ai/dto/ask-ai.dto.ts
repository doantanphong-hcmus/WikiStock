import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AskAiDto {
  @ValidateIf((payload: AskAiDto) => !payload.question)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  query?: string;

  @ValidateIf((payload: AskAiDto) => !payload.query)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  question?: string;

  @ValidateIf((payload: AskAiDto) => !payload.ticker)
  @IsString()
  @Matches(/^[A-Za-z0-9]{1,10}$/)
  companyCode?: string;

  @ValidateIf((payload: AskAiDto) => !payload.companyCode)
  @IsString()
  @Matches(/^[A-Za-z0-9]{1,10}$/)
  ticker?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  context?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  conversationId?: string;
}
