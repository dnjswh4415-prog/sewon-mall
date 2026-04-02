import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: '수령인 이름은 필수입니다.' })
  recipient: string;

  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수입니다.' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: '우편번호는 필수입니다.' })
  zipcode: string;

  @IsString()
  @IsNotEmpty({ message: '기본 주소는 필수입니다.' })
  address1: string;

  @IsString()
  @IsNotEmpty({ message: '상세 주소는 필수입니다.' })
  address2: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}