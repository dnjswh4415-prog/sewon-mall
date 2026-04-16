import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PayPayService } from './paypay.service';
import { OrderService } from '../order/order.service';

@Controller('paypay')
export class PayPayController {
  constructor(
    private readonly payPayService: PayPayService,
    private readonly orderService: OrderService,
  ) {}

  private getUserId(req: any) {
    return Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-code')
  async createCode(
    @Req() req: any,
    @Headers('user-agent') userAgent: string,
    @Body()
    body: {
      orderId: number;
    },
  ) {
    const userId = this.getUserId(req);

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    if (!body?.orderId) {
      throw new BadRequestException('orderId가 필요합니다.');
    }

    const order = await this.orderService.getOrderDetail(userId, Number(body.orderId));

    if (!order) {
      throw new BadRequestException('주문을 찾을 수 없습니다.');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('결제 가능한 주문 상태가 아닙니다.');
    }

    const result = await this.payPayService.createCode({
      merchantPaymentId: order.orderNumber,
      amount: Number(order.totalPrice),
      orderDescription: `${order.orderNumber} PayPay 결제`,
      userAgent,
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Req() req: any, @Query('merchantPaymentId') merchantPaymentId?: string) {
    const userId = this.getUserId(req);

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    if (!merchantPaymentId) {
      throw new BadRequestException('merchantPaymentId가 필요합니다.');
    }

    const result = await this.payPayService.getPaymentDetails(merchantPaymentId);

    return result;
  }
}