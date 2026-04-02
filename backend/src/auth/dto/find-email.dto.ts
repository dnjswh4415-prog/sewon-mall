import { IsNotEmpty, IsString } from 'class-validator';

export class FindEmailDto {
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수입니다.' })
  phone: string;
}