import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private getUserId(req: any) {
    const userId = Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);

    if (!userId || userId < 1) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return userId;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new BadRequestException('주문 상품이 없습니다.');
    }

    if (!body?.addressId) {
      throw new BadRequestException('배송지를 선택하세요.');
    }

    if (!body?.clientOrderKey || !String(body.clientOrderKey).trim()) {
      throw new BadRequestException('주문 키가 없습니다.');
    }

    const order = await this.orderService.createOrder(
      userId,
      body.items,
      Number(body.addressId),
      String(body.clientOrderKey),
    );

    return {
      id: order.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      status: order.status,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyOrdersRoot(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('period') period?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = this.getUserId(req);

    return this.orderService.getMyOrders(userId, {
      page,
      pageSize,
      period,
      keyword,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyOrders(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('period') period?: string,
    @Query('keyword') keyword?: string,
  ) {
    const userId = this.getUserId(req);

    return this.orderService.getMyOrders(userId, {
      page,
      pageSize,
      period,
      keyword,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/list')
  async getAdminOrders(@Query('status') status?: string) {
    return this.orderService.getAdminOrders(status);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/:id')
  async getAdminOrderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getAdminOrderDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderDetail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return this.orderService.getOrderDetail(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelOrder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return this.orderService.cancelOrder(userId, id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/ship')
  async shipOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    if (!body?.deliveryCompany || !body?.trackingNumber) {
      throw new BadRequestException('택배사와 송장번호를 입력하세요.');
    }

    return this.orderService.startShipping(
      id,
      String(body.deliveryCompany),
      String(body.trackingNumber),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/deliver')
  async deliverOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.completeDelivery(id);
  }
}