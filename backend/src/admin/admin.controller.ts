import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('products')
  getProducts(@Query() query: Record<string, string | undefined>) {
    return this.adminService.getProducts(query);
  }

  @Get('products/:id')
  getProductDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getProductDetail(id);
  }

  @Get('orders')
  getOrders(@Query() query: Record<string, string | undefined>) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/:id')
  getOrderDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getOrderDetail(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Get('stock-summary')
  getStockSummary() {
    return this.adminService.getStockSummary();
  }
}