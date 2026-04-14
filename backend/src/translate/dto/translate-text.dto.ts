import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class TranslateTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsIn(['koToJa', 'jaToKo'])
  direction: 'koToJa' | 'jaToKo';
}