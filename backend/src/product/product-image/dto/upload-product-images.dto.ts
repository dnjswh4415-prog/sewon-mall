import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class UploadProductImagesDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  sortOrder?: number;
}