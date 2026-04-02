import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getMyWishlist(@Req() req: any) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.wishlistService.getMyWishlist(Number(userId));
  }

  @Post('toggle')
  toggleWishlist(@Req() req: any, @Body() dto: ToggleWishlistDto) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.wishlistService.toggleWishlist(
      Number(userId),
      Number(dto.productId),
    );
  }

  @Delete(':id')
  removeWishlistItem(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.wishlistService.removeWishlistItem(Number(userId), id);
  }
}