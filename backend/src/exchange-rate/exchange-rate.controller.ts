import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get('jpy')
  async getLatestJpyRate() {
    return this.exchangeRateService.getLatestJpyRate();
  }

  @Get('convert/jpy')
  async convertKrwToJpy(
    @Query('krwAmount') krwAmount?: string,
    @Query('bufferPercent') bufferPercent?: string,
    @Query('roundupUnit') roundupUnit?: string,
  ) {
    const parsedKrwAmount = Number(krwAmount);
    const parsedBufferPercent =
      bufferPercent !== undefined ? Number(bufferPercent) : 0;
    const parsedRoundupUnit =
      roundupUnit !== undefined ? Number(roundupUnit) : 10;

    if (!Number.isFinite(parsedKrwAmount) || parsedKrwAmount <= 0) {
      throw new BadRequestException('krwAmount는 0보다 큰 숫자여야 합니다.');
    }

    if (!Number.isFinite(parsedBufferPercent) || parsedBufferPercent < 0) {
      throw new BadRequestException(
        'bufferPercent는 0 이상 숫자여야 합니다.',
      );
    }

    if (!Number.isFinite(parsedRoundupUnit) || parsedRoundupUnit <= 0) {
      throw new BadRequestException('roundupUnit은 1 이상 숫자여야 합니다.');
    }

    return this.exchangeRateService.convertLatestKrwToJpy(parsedKrwAmount, {
      bufferPercent: parsedBufferPercent,
      roundupUnit: parsedRoundupUnit,
    });
  }
}