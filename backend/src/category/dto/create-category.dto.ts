import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: '카테고리명은 필수입니다.' })
  name: string;

  @IsOptional()
  @IsInt({ message: 'parentId는 숫자여야 합니다.' })
  @Min(1, { message: 'parentId는 1 이상이어야 합니다.' })
  parentId?: number;
}