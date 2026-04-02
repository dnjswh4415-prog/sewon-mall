import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface OrderItemInput {
  productId: number;
  variantId?: number | null;
  quantity: number;
  price?: number;
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber(userId: number) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${Date.now()}-${userId}-${random}`;
  }

  async createOrder(
    userId: number,
    items: OrderItemInput[],
    addressId?: number,
    clientOrderKey?: string,
  ) {
    const normalizedUserId = Number(userId);
    const normalizedAddressId = Number(addressId);

    if (!normalizedUserId || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    if (!items || !items.length) {
      throw new BadRequestException('주문 상품이 없습니다.');
    }

    if (!normalizedAddressId || normalizedAddressId < 1) {
      throw new BadRequestException('배송지를 선택하세요');
    }

    if (!clientOrderKey || !String(clientOrderKey).trim()) {
      throw new BadRequestException('주문 키가 없습니다.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingOrder = await tx.order.findFirst({
        where: {
          userId: normalizedUserId,
          clientOrderKey: String(clientOrderKey),
        },
        include: {
          address: true,
          items: {
            include: {
              product: true,
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
          },
        },
      });

      if (existingOrder) {
        if (existingOrder.status === 'PENDING_PAYMENT') {
          return existingOrder;
        }

        throw new BadRequestException(
          '이미 사용된 주문 키입니다. 다시 주문해주세요.',
        );
      }

      const address = await tx.address.findFirst({
        where: {
          id: normalizedAddressId,
          userId: normalizedUserId,
        },
      });

      if (!address) {
        throw new NotFoundException('배송지를 찾을 수 없습니다.');
      }

      let totalPrice = 0;

      const productIds = [...new Set(items.map((i) => Number(i.productId)))];

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      const variantIds = [
        ...new Set(
          items
            .filter((i) => i.variantId != null)
            .map((i) => Number(i.variantId)) as number[],
        ),
      ];

      const variants =
        variantIds.length > 0
          ? await tx.productVariant.findMany({
              where: {
                id: { in: variantIds },
              },
            })
          : [];

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of items) {
        const normalizedProductId = Number(item.productId);
        const normalizedQuantity = Number(item.quantity);
        const normalizedVariantId =
          item.variantId != null ? Number(item.variantId) : null;

        const product = productMap.get(normalizedProductId);

        if (!product) {
          throw new NotFoundException(
            `존재하지 않는 상품입니다. productId=${normalizedProductId}`,
          );
        }

        if (!normalizedQuantity || normalizedQuantity <= 0) {
          throw new BadRequestException('수량이 올바르지 않습니다.');
        }

        if (normalizedVariantId) {
          const variant = variantMap.get(normalizedVariantId);

          if (!variant) {
            throw new BadRequestException('옵션이 존재하지 않습니다.');
          }

          if (variant.productId !== normalizedProductId) {
            throw new BadRequestException('상품과 옵션이 일치하지 않습니다.');
          }

          if (!variant.isActive) {
            throw new BadRequestException('비활성화된 옵션입니다.');
          }

          if (variant.stock < normalizedQuantity) {
            throw new BadRequestException(
              `옵션 재고가 부족합니다. variantId=${normalizedVariantId}`,
            );
          }

          totalPrice += Number(variant.price ?? product.price) * normalizedQuantity;
        } else {
          if (product.stock < normalizedQuantity) {
            throw new BadRequestException(
              `상품 재고가 부족합니다. productId=${normalizedProductId}`,
            );
          }

          totalPrice += Number(product.price) * normalizedQuantity;
        }
      }

      const orderNumber = this.generateOrderNumber(normalizedUserId);

      const order = await tx.order.create({
        data: {
          orderNumber,
          clientOrderKey: String(clientOrderKey),
          totalPrice,
          status: 'PENDING_PAYMENT',
          user: {
            connect: { id: normalizedUserId },
          },
          address: {
            connect: { id: normalizedAddressId },
          },
          items: {
            create: items.map((item) => {
              const normalizedProductId = Number(item.productId);
              const normalizedQuantity = Number(item.quantity);
              const normalizedVariantId =
                item.variantId != null ? Number(item.variantId) : null;

              const product = productMap.get(normalizedProductId)!;
              const variant = normalizedVariantId
                ? variantMap.get(normalizedVariantId)
                : null;

              return {
                productId: normalizedProductId,
                variantId: normalizedVariantId,
                quantity: normalizedQuantity,
                price: Number(variant?.price ?? product.price),
              };
            }),
          },
        },
        include: {
          address: true,
          items: {
            include: {
              product: true,
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
          },
        },
      });

      return order;
    });
  }

  async getMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId: Number(userId) },
      include: {
        address: true,
        items: {
          include: {
            product: true,
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
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderDetail(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: Number(orderId),
        userId: Number(userId),
      },
      include: {
        address: true,
        items: {
          include: {
            product: true,
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
            reviews: true,
          },
        },
        payments: true,
        cancels: true,
        returns: true,
        refunds: true,
        stockHistories: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async cancelOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: Number(orderId),
        userId: Number(userId),
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (
      order.status !== 'PAYMENT_COMPLETE' &&
      order.status !== 'SHIPPING'
    ) {
      throw new BadRequestException('현재 상태에서는 주문 취소가 불가능합니다.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
        },
      });

      await tx.cancel.create({
        data: {
          orderId: order.id,
          reason: '사용자 요청 취소',
        },
      });

      for (const item of order.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant) {
            throw new NotFoundException('옵션 상품을 찾을 수 없습니다.');
          }

          const beforeStock = Number(variant.stock);
          const afterStock = beforeStock + Number(item.quantity);

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: afterStock,
            },
          });

          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              orderId: order.id,
              orderItemId: item.id,
              quantity: Number(item.quantity),
              changeType: 'CANCEL_RESTORE',
              beforeStock,
              afterStock,
              note: '주문 취소로 옵션 재고 복구',
            },
          });
        } else {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException('상품을 찾을 수 없습니다.');
          }

          const beforeStock = Number(product.stock);
          const afterStock = beforeStock + Number(item.quantity);

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: afterStock,
            },
          });

          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              orderId: order.id,
              orderItemId: item.id,
              quantity: Number(item.quantity),
              changeType: 'CANCEL_RESTORE',
              beforeStock,
              afterStock,
              note: '주문 취소로 상품 재고 복구',
            },
          });
        }
      }

      return { message: '주문이 취소되었습니다.' };
    });
  }

  async startShipping(
    orderId: number,
    deliveryCompany: string,
    trackingNumber: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      throw new NotFoundException('주문 없음');
    }

    if (order.status !== 'PAYMENT_COMPLETE') {
      throw new BadRequestException('배송 시작 불가 상태');
    }

    return this.prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        status: 'SHIPPING',
        deliveryCompany,
        trackingNumber,
      },
    });
  }

  async completeDelivery(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      throw new NotFoundException('주문 없음');
    }

    if (order.status !== 'SHIPPING') {
      throw new BadRequestException('배송중 주문만 완료 가능');
    }

    return this.prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        status: 'DELIVERED',
      },
    });
  }

  async getAdminOrders(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as any } : {},
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAdminOrderDetail(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
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
            reviews: true,
          },
        },
        payments: true,
        cancels: true,
        returns: true,
        refunds: true,
        stockHistories: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }
}