import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('ping')
  ping() {
    this.logger.log('payments ping called');
    return { message: 'payments ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  confirmPayment(@Req() req: any, @Body() dto: ConfirmPaymentDto) {
    const userId = Number(
      req.user?.id ?? req.user?.userId ?? req.user?.sub,
    );

    this.logger.log(`confirmPayment user=${JSON.stringify(req.user)}`);
    this.logger.log(`confirmPayment dto=${JSON.stringify(dto)}`);

    if (!userId || userId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    return this.paymentsService.confirmPayment(userId, dto);
  }
}