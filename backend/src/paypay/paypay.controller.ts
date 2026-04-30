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

@Controller('paypay')
export class PayPayController {
  constructor(private readonly payPayService: PayPayService) {}

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

    return this.payPayService.createCodeForOrder(
      userId,
      Number(body.orderId),
      userAgent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(
    @Req() req: any,
    @Query('merchantPaymentId') merchantPaymentId?: string,
  ) {
    const userId = this.getUserId(req);

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    if (!merchantPaymentId) {
      throw new BadRequestException('merchantPaymentId가 필요합니다.');
    }

    return this.payPayService.getPaymentDetails(merchantPaymentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirm(
    @Req() req: any,
    @Body()
    body: {
      merchantPaymentId: string;
    },
  ) {
    const userId = this.getUserId(req);

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    if (!body?.merchantPaymentId) {
      throw new BadRequestException('merchantPaymentId가 필요합니다.');
    }

    return this.payPayService.confirmOrder(userId, body.merchantPaymentId);
  }
}