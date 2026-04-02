import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt({ message: 'sortOrder는 숫자여야 합니다.' })
  @Min(0, { message: 'sortOrder는 0 이상이어야 합니다.' })
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}