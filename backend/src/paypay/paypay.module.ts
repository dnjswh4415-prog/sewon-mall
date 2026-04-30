import { Module } from '@nestjs/common';
import { PayPayController } from './paypay.controller';
import { PayPayService } from './paypay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, ExchangeRateModule, PaymentsModule],
  controllers: [PayPayController],
  providers: [PayPayService],
  exports: [PayPayService],
})
export class PayPayModule {}