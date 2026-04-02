import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('products')
  getStockProducts() {
    return this.stockService.getStockProducts();
  }

  @Get('history')
  getStockHistory(@Query('productId') productId?: string) {
    return this.stockService.getStockHistory(
      productId ? Number(productId) : undefined,
    );
  }

  @Get('products/:productId/detail')
  getStockProductDetail(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.stockService.getStockProductDetail(productId);
  }

  @Post('adjust')
  updateStock(@Body() dto: UpdateStockDto) {
    return this.stockService.updateStock(dto);
  }
}