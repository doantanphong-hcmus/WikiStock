import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDocumentDto {
  @IsIn(['pending', 'approved', 'rejected'])
  reviewStatus!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
