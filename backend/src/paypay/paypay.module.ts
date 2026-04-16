import { Module } from '@nestjs/common';
import { PayPayController } from './paypay.controller';
import { PayPayService } from './paypay.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [PayPayController],
  providers: [PayPayService],
  exports: [PayPayService],
})
export class PayPayModule {}