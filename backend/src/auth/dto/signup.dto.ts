import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: '비밀번호는 8자 이상, 영문 + 숫자 + 특수문자를 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수입니다.' })
  phone: string;
}