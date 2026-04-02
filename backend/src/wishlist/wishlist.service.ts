import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  // 내 찜목록 조회
  async getMyWishlist(userId: number) {
    const normalizedUserId = Number(userId);

    if (!normalizedUserId || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    return this.prisma.wishlist.findMany({
      where: {
        userId: normalizedUserId,
      },
      include: {
        product: {
          include: {
            Category: true,
            images: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  // 찜 토글
  async toggleWishlist(userId: number, productId: number) {
    const normalizedUserId = Number(userId);
    const normalizedProductId = Number(productId);

    if (!normalizedUserId || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    if (!normalizedProductId || normalizedProductId < 1) {
      throw new BadRequestException('유효하지 않은 상품입니다.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: normalizedProductId },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const existing = await this.prisma.wishlist.findFirst({
      where: {
        userId: normalizedUserId,
        productId: normalizedProductId,
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });

      return {
        liked: false,
        message: '찜목록에서 제거되었습니다.',
      };
    }

    await this.prisma.wishlist.create({
      data: {
        userId: normalizedUserId,
        productId: normalizedProductId,
      },
    });

    return {
      liked: true,
      message: '찜목록에 추가되었습니다.',
    };
  }

  // 선택 삭제용
  async removeWishlistItem(userId: number, wishlistId: number) {
    const normalizedUserId = Number(userId);
    const normalizedWishlistId = Number(wishlistId);

    const item = await this.prisma.wishlist.findFirst({
      where: {
        id: normalizedWishlistId,
        userId: normalizedUserId,
      },
    });

    if (!item) {
      throw new NotFoundException('찜 항목을 찾을 수 없습니다.');
    }

    await this.prisma.wishlist.delete({
      where: { id: normalizedWishlistId },
    });

    return { message: '찜목록에서 삭제되었습니다.' };
  }
}