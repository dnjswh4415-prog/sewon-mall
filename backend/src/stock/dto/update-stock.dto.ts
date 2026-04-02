import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId?: number;

  @Type(() => Number)
  @IsInt()
  quantity: number;

  @IsEnum(['MANUAL_ADJUST'])
  changeType: 'MANUAL_ADJUST';

  @IsOptional()
  @IsString()
  note?: string;
}