import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsInt({ message: 'rating은 숫자여야 합니다.' })
  @Min(1, { message: '평점은 1 이상이어야 합니다.' })
  @Max(5, { message: '평점은 5 이하여야 합니다.' })
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}