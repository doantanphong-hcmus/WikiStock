import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class StreamMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @IsUUID()
  clientRequestId!: string;
}
