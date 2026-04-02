import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async getStockProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        Category: true,
        variants: {
          where: { isActive: true },
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

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.Category?.name ?? null,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      hasVariants: product.variants.length > 0,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        stock: variant.stock,
        price: variant.price,
        isActive: variant.isActive,
        optionText: variant.options
          .map((o) => `${o.value.option.name}: ${o.value.value}`)
          .join(' / '),
      })),
    }));
  }

  async getStockHistory(productId?: number) {
    return this.prisma.stockHistory.findMany({
      where: {
        ...(productId ? { productId } : {}),
      },
      include: {
        product: true,
        variant: true,
        order: true,
        orderItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });
  }

  async getStockProductDetail(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        Category: true,
        variants: {
          where: { isActive: true },
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
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const histories = await this.prisma.stockHistory.findMany({
      where: {
        productId,
      },
      include: {
        product: true,
        variant: true,
        order: true,
        orderItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 300,
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        category: product.Category?.name ?? null,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        hasVariants: product.variants.length > 0,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          stock: variant.stock,
          price: variant.price,
          isActive: variant.isActive,
          optionText: variant.options
            .map((o) => `${o.value.option.name}: ${o.value.value}`)
            .join(' / '),
        })),
      },
      histories,
      summary: {
        totalHistoryCount: histories.length,
      },
    };
  }

  async updateStock(dto: UpdateStockDto) {
    const { productId, variantId, quantity, note } = dto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (!quantity || Number(quantity) === 0) {
      throw new BadRequestException('변경 수량은 0이 될 수 없습니다.');
    }

    if (variantId) {
      return this.prisma.$transaction(async (tx) => {
        const variant = await tx.productVariant.findFirst({
          where: {
            id: variantId,
            productId,
          },
        });

        if (!variant) {
          throw new NotFoundException('옵션 재고를 찾을 수 없습니다.');
        }

        const beforeStock = Number(variant.stock);
        const afterStock = beforeStock + Number(quantity);

        if (afterStock < 0) {
          throw new BadRequestException('재고는 0개 미만이 될 수 없습니다.');
        }

        const updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: afterStock,
          },
        });

        await tx.stockHistory.create({
          data: {
            productId,
            variantId,
            changeType: 'MANUAL_ADJUST',
            quantity: Number(quantity),
            beforeStock,
            afterStock,
            note,
          },
        });

        return {
          message: '옵션 재고가 수정되었습니다.',
          variant: updatedVariant,
        };
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const targetProduct = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!targetProduct) {
        throw new NotFoundException('상품을 찾을 수 없습니다.');
      }

      const beforeStock = Number(targetProduct.stock);
      const afterStock = beforeStock + Number(quantity);

      if (afterStock < 0) {
        throw new BadRequestException('재고는 0개 미만이 될 수 없습니다.');
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: afterStock,
        },
      });

      await tx.stockHistory.create({
        data: {
          productId,
          changeType: 'MANUAL_ADJUST',
          quantity: Number(quantity),
          beforeStock,
          afterStock,
          note,
        },
      });

      return {
        message: '상품 재고가 수정되었습니다.',
        product: updatedProduct,
      };
    });
  }
}