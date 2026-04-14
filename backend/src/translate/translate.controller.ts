import { Body, Controller, Post } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateTextDto } from './dto/translate-text.dto';

@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  translateText(@Body() dto: TranslateTextDto) {
    return this.translateService.translateText(dto);
  }
}