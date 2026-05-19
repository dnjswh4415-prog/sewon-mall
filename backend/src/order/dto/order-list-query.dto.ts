import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsInt,
} from 'class-validator';

export class OrderListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['all', '1m', '3m', '6m', '1y'])
  period?: string = 'all';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}