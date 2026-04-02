import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartDto } from './dto/add-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            Category: true,
          },
        },
        variant: {
          include: {
            options: {
              include: {
                value: {
                  include: {
                    option: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async addToCart(userId: number, dto: AddCartDto) {
    const { productId, quantity, variantId } = dto;

    if (!productId || productId < 1) {
      throw new BadRequestException('올바른 상품 정보가 아닙니다.');
    }

    if (!quantity || quantity < 1) {
      throw new BadRequestException('수량은 1개 이상이어야 합니다.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const hasVariants = product.variants.length > 0;
    const normalizedVariantId = variantId ?? null;

    if (hasVariants && !normalizedVariantId) {
      throw new BadRequestException('옵션을 선택해주세요.');
    }

    if (!hasVariants && normalizedVariantId) {
      throw new BadRequestException('옵션 상품이 아닙니다.');
    }

    let targetStock = product.stock;

    if (normalizedVariantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: normalizedVariantId,
          productId,
          isActive: true,
        },
      });

      if (!variant) {
        throw new NotFoundException('선택한 옵션을 찾을 수 없습니다.');
      }

      targetStock = variant.stock;
    }

    if (quantity > targetStock) {
      throw new BadRequestException('재고가 부족합니다.');
    }

    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        variantId: normalizedVariantId,
      },
    });

    if (existingCartItem) {
      const nextQuantity = existingCartItem.quantity + quantity;

      if (nextQuantity > targetStock) {
        throw new BadRequestException('장바구니 수량이 재고를 초과합니다.');
      }

      return this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: nextQuantity,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        variantId: normalizedVariantId,
        quantity,
      },
    });
  }

  async updateCartItem(cartItemId: number, quantity: number, userId: number) {
    if (!quantity || quantity < 1) {
      throw new BadRequestException('수량은 1개 이상이어야 합니다.');
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('장바구니 상품을 찾을 수 없습니다.');
    }

    const stock = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock;

    if (quantity > stock) {
      throw new BadRequestException('재고보다 많이 담을 수 없습니다.');
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeCartItem(cartItemId: number, userId: number) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('장바구니 상품을 찾을 수 없습니다.');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return { message: '장바구니에서 삭제되었습니다.' };
  }
}