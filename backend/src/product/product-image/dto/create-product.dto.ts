import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
  @IsInt({ message: 'productId는 숫자여야 합니다.' })
  @Min(1, { message: 'productId는 1 이상이어야 합니다.' })
  productId: number;

  @IsString()
  @IsNotEmpty({ message: 'imageUrl은 필수입니다.' })
  imageUrl: string;

  @IsOptional()
  @IsInt({ message: 'sortOrder는 숫자여야 합니다.' })
  @Min(0, { message: 'sortOrder는 0 이상이어야 합니다.' })
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}