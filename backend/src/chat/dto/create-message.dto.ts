import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsUUID()
  clientRequestId?: string;
}
