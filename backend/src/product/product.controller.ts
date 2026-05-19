import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  private getUserId(req: any) {
    return Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);
  }

  @Get()
  getProducts(@Query() query: ProductQueryDto) {
    return this.productService.getProducts({
      categoryId: query.categoryId,
      keyword: query.keyword,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations/me')
  getRecommendationsByUser(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = this.getUserId(req);

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.productService.getBfsRecommendationsByUser(
      userId,
      limit ? Number(limit) : 8,
    );
  }

  @Get(':id/recommendations')
  getRecommendationsByProduct(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    return this.productService.getBfsRecommendationsByProduct(
      id,
      limit ? Number(limit) : 8,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/view')
  recordView(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = this.getUserId(req);

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.productService.recordProductView(userId, id);
  }

  @Get(':id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }
}