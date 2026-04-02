import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddCartDto } from './dto/add-cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('add')
  add(@Req() req: any, @Body() body: AddCartDto) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.cartService.addToCart(Number(userId), {
      productId: Number(body.productId),
      quantity: Number(body.quantity ?? 1),
      variantId: body.variantId ? Number(body.variantId) : undefined,
    });
  }

  @Get()
  get(@Req() req: any) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.cartService.getCart(Number(userId));
  }

  @Put('update')
  update(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.cartService.updateCartItem(
      Number(body.cartItemId),
      Number(body.quantity),
      Number(userId),
    );
  }

  @Delete(':cartItemId')
  remove(@Req() req: any, @Param('cartItemId') cartItemId: string) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.cartService.removeCartItem(Number(cartItemId), Number(userId));
  }
}