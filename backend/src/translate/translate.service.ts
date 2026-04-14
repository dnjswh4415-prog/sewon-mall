import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TranslateTextDto } from './dto/translate-text.dto';

@Injectable()
export class TranslateService {
  async translateText(dto: TranslateTextDto) {
    const clientId = process.env.PAPAGO_CLIENT_ID;
    const clientSecret = process.env.PAPAGO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Papago 환경변수가 설정되지 않았습니다.',
      );
    }

    const text = String(dto.text ?? '').trim();

    if (!text) {
      throw new BadRequestException('번역할 텍스트가 없습니다.');
    }

    let source = 'ko';
    let target = 'ja';

    if (dto.direction === 'jaToKo') {
      source = 'ja';
      target = 'ko';
    }

    const body = new URLSearchParams({
      source,
      target,
      text,
    });

    const response = await fetch(
      'https://papago.apigw.ntruss.com/nmt/v1/translation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
        body: body.toString(),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new BadRequestException(
        result?.errorMessage || result?.message || 'Papago 번역에 실패했습니다.',
      );
    }

    return {
      source,
      target,
      originalText: text,
      translatedText: result?.message?.result?.translatedText ?? '',
    };
  }
}