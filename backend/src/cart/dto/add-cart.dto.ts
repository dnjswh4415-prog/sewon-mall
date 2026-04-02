import { IsInt, IsOptional, Min } from 'class-validator';

export class AddCartDto {
  @IsInt({ message: 'productId는 숫자여야 합니다.' })
  @Min(1, { message: 'productId는 1 이상이어야 합니다.' })
  productId: number;

  @IsInt({ message: 'quantity는 숫자여야 합니다.' })
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  quantity: number;

  @IsOptional()
  @IsInt({ message: 'variantId는 숫자여야 합니다.' })
  @Min(1, { message: 'variantId는 1 이상이어야 합니다.' })
  variantId?: number;
}