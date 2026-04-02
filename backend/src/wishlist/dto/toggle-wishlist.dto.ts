import { IsInt, Min } from 'class-validator';

export class ToggleWishlistDto {
  @IsInt({ message: 'productId는 숫자여야 합니다.' })
  @Min(1, { message: 'productId는 1 이상이어야 합니다.' })
  productId: number;
}