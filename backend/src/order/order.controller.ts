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
import { CreateOrderDto } from './dto/create-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';

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
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = this.getUserId(req);

    const order = await this.orderService.createOrder(
      userId,
      dto.items,
      dto.addressId,
      dto.clientOrderKey,
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
    @Query() query: OrderListQueryDto,
  ) {
    const userId = this.getUserId(req);

    return this.orderService.getMyOrders(userId, {
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 10),
      period: query.period,
      keyword: query.keyword,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyOrders(
    @Req() req: any,
    @Query() query: OrderListQueryDto,
  ) {
    const userId = this.getUserId(req);

    return this.orderService.getMyOrders(userId, {
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 10),
      period: query.period,
      keyword: query.keyword,
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
  async getOrderDetail(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = this.getUserId(req);
    return this.orderService.getOrderDetail(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelOrder(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = this.getUserId(req);
    return this.orderService.cancelOrder(userId, id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/ship')
  async shipOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ShipOrderDto,
  ) {
    return this.orderService.startShipping(
      id,
      dto.deliveryCompany,
      dto.trackingNumber,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/deliver')
  async deliverOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.completeDelivery(id);
  }
}