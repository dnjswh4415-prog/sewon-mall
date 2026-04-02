import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [totalUsers, totalProducts, totalOrders, totalReviews] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.review.count(),
      ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalReviews,
    };
  }

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        Category: true,
        images: true,
        options: {
          include: {
            values: true,
          },
        },
        variants: {
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

  async getOrders() {
    return this.prisma.order.findMany({
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

  async getOrderDetail(orderId: number) {
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
        stockHistories: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async updateOrderStatus(orderId: number, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    const allowedStatuses = [
      'PENDING_PAYMENT',
      'PAYMENT_COMPLETE',
      'SHIPPING',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
      'REFUNDED',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('허용되지 않은 주문 상태입니다.');
    }

    const currentStatus = String(order.status);

    if (currentStatus === status) {
      return order;
    }

    const allowedTransitions: Record<string, string[]> = {
      PENDING_PAYMENT: ['CANCELLED'],
      PAYMENT_COMPLETE: ['SHIPPING', 'CANCELLED', 'REFUNDED'],
      SHIPPING: ['DELIVERED', 'RETURNED'],
      DELIVERED: ['RETURNED', 'REFUNDED'],
      CANCELLED: [],
      RETURNED: ['REFUNDED'],
      REFUNDED: [],
    };

    const nextStatuses = allowedTransitions[currentStatus] ?? [];

    if (!nextStatuses.includes(status)) {
      throw new BadRequestException(
        `주문 상태를 ${currentStatus}에서 ${status}(으)로 변경할 수 없습니다.`,
      );
    }

    return this.prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        status: status as any,
      },
    });
  }

  async getStockSummary() {
    const [products, paidOrders, restoreTargetOrders] = await Promise.all([
      this.prisma.product.findMany({
        include: {
          Category: true,
          variants: {
            where: { isActive: true },
          },
        },
        orderBy: {
          id: 'desc',
        },
      }),

      this.prisma.order.findMany({
        where: {
          status: {
            in: ['PAYMENT_COMPLETE', 'SHIPPING', 'DELIVERED'] as any,
          },
        },
        include: {
          stockHistories: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.order.findMany({
        where: {
          status: {
            in: ['CANCELLED', 'RETURNED', 'REFUNDED'] as any,
          },
        },
        include: {
          stockHistories: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const lowStockProducts = products
      .filter((product) => Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD)
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: product.Category?.name ?? null,
        stock: Number(product.stock ?? 0),
      }));

    const lowStockVariants = products.flatMap((product) =>
      (product.variants ?? [])
        .filter((variant) => Number(variant.stock ?? 0) <= LOW_STOCK_THRESHOLD)
        .map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          stock: Number(variant.stock ?? 0),
          product: {
            id: product.id,
            name: product.name,
          },
        })),
    );

    const paidWithoutDeduction = paidOrders
      .filter((order) => {
        return !order.stockHistories.some(
          (history) => String(history.changeType) === 'ORDER_PAID',
        );
      })
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      }));

    const missingRestore = restoreTargetOrders
      .filter((order) => {
        const hasDeduction = order.stockHistories.some(
          (history) => String(history.changeType) === 'ORDER_PAID',
        );

        const hasRestore = order.stockHistories.some((history) =>
          ['CANCEL_RESTORE', 'RETURN_RESTORE', 'REFUND_RESTORE'].includes(
            String(history.changeType),
          ),
        );

        return hasDeduction && !hasRestore;
      })
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      }));

    return {
      lowStockProducts,
      lowStockVariants,
      paidWithoutDeduction,
      missingRestore,
    };
  }
}