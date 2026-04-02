import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt({ message: 'orderItemId는 숫자여야 합니다.' })
  orderItemId: number;

  @IsInt({ message: 'rating은 숫자여야 합니다.' })
  @Min(1, { message: '평점은 1 이상이어야 합니다.' })
  @Max(5, { message: '평점은 5 이하여야 합니다.' })
  rating: number;

  @IsString()
  @IsNotEmpty({ message: '리뷰 내용은 필수입니다.' })
  comment: string;
}