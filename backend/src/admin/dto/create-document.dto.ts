import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;

  @IsInt()
  @Min(1)
  sourceId!: number;

  @IsInt()
  @Min(1)
  docTypeId!: number;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsUrl({ require_protocol: true })
  url!: string;

  @IsOptional()
  @IsString()
  fileRef?: string;

  @IsOptional()
  @Matches(/^[a-fA-F0-9]{64}$/)
  checksum?: string;
}
