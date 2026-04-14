import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type AdminOrderListQuery = Record<string, string | undefined>;
type AdminProductListQuery = Record<string, string | undefined>;

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

  private parsePage(raw?: string) {
    const value = Number(raw ?? DEFAULT_PAGE);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_PAGE;
  }

  private parsePageSize(raw?: string) {
    const value = Number(raw ?? DEFAULT_PAGE_SIZE);
    if (!Number.isFinite(value) || value < 1) return DEFAULT_PAGE_SIZE;
    return Math.min(Math.floor(value), MAX_PAGE_SIZE);
  }

  private parseSortOrder(raw?: string): Prisma.SortOrder {
    return raw === 'asc' ? 'asc' : 'desc';
  }

  private buildOrderWhere(query: AdminOrderListQuery): Prisma.OrderWhereInput {
    const status = String(query.status ?? 'ALL');
    const keyword = String(query.keyword ?? '').trim();

    const where: Prisma.OrderWhereInput = {};

    if (status !== 'ALL') {
      where.status = status as OrderStatus;
    }

    if (keyword) {
      where.OR = [
        { orderNumber: { contains: keyword } },
        { user: { name: { contains: keyword } } },
        { user: { email: { contains: keyword } } },
        { address: { recipient: { contains: keyword } } },
        { address: { phone: { contains: keyword } } },
      ];
    }

    return where;
  }

  private buildOrderOrderBy(
    sortByRaw?: string,
    sortOrderRaw?: string,
  ): Prisma.OrderOrderByWithRelationInput {
    const sortBy = String(sortByRaw ?? 'createdAt');
    const sortOrder = this.parseSortOrder(sortOrderRaw);

    switch (sortBy) {
      case 'orderNumber':
        return { orderNumber: sortOrder };
      case 'totalPrice':
        return { totalPrice: sortOrder };
      case 'status':
        return { status: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }

  private buildProductWhere(query: AdminProductListQuery): Prisma.ProductWhereInput {
    const keyword = String(query.keyword ?? '').trim();
    const stockFilter = String(query.stockFilter ?? 'ALL');
    const categoryId = Number(query.categoryId ?? 0);

    const where: Prisma.ProductWhereInput = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { Category: { name: { contains: keyword } } },
      ];
    }

    if (categoryId > 0) {
      where.categoryId = categoryId;
    }

    if (stockFilter === 'LOW_STOCK') {
      where.stock = { lte: LOW_STOCK_THRESHOLD };
    }

    if (stockFilter === 'NO_IMAGE') {
      where.images = { none: {} };
    }

    return where;
  }

  private buildProductOrderBy(
    sortByRaw?: string,
    sortOrderRaw?: string,
  ): Prisma.ProductOrderByWithRelationInput {
    const sortBy = String(sortByRaw ?? 'createdAt');
    const sortOrder = this.parseSortOrder(sortOrderRaw);

    switch (sortBy) {
      case 'name':
        return { name: sortOrder };
      case 'price':
        return { price: sortOrder };
      case 'stock':
        return { stock: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }

  async getProducts(query: AdminProductListQuery) {
    const page = this.parsePage(query.page);
    const pageSize = this.parsePageSize(query.pageSize);
    const where = this.buildProductWhere(query);
    const orderBy = this.buildProductOrderBy(query.sortBy, query.sortOrder);

    const [items, totalCount, totalVariants, noImageCount, lowStockCount] =
      await Promise.all([
        this.prisma.product.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy,
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
            createdAt: true,
            Category: {
              select: {
                id: true,
                name: true,
              },
            },
            images: {
              where: { isMain: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: {
                id: true,
                imageUrl: true,
                isMain: true,
              },
            },
            _count: {
              select: {
                variants: true,
                options: true,
                images: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
        this.prisma.productVariant.count({
          where: {
            product: where,
          },
        }),
        this.prisma.product.count({
          where: {
            AND: [where, { images: { none: {} } }],
          },
        }),
        this.prisma.product.count({
          where: {
            AND: [where, { stock: { lte: LOW_STOCK_THRESHOLD } }],
          },
        }),
      ]);

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      summary: {
        totalProducts: totalCount,
        totalVariants,
        noImageCount,
        lowStockCount,
      },
    };
  }

  async getProductDetail(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
      include: {
        Category: true,
        images: {
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        },
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
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return product;
  }

  async getOrders(query: AdminOrderListQuery) {
    const page = this.parsePage(query.page);
    const pageSize = this.parsePageSize(query.pageSize);
    const where = this.buildOrderWhere(query);
    const orderBy = this.buildOrderOrderBy(query.sortBy, query.sortOrder);

    const [items, totalCount, amountAggregate, pendingCount, shippingCount, cancelledCount] =
      await Promise.all([
        this.prisma.order.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalPrice: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            address: {
              select: {
                recipient: true,
                phone: true,
                address1: true,
                address2: true,
              },
            },
            items: {
              take: 1,
              orderBy: { id: 'asc' },
              select: {
                id: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
        }),
        this.prisma.order.count({ where }),
        this.prisma.order.aggregate({
          where,
          _sum: {
            totalPrice: true,
          },
        }),
        this.prisma.order.count({
          where: {
            AND: [where, { status: 'PENDING_PAYMENT' }],
          },
        }),
        this.prisma.order.count({
          where: {
            AND: [where, { status: 'SHIPPING' }],
          },
        }),
        this.prisma.order.count({
          where: {
            AND: [where, { status: 'CANCELLED' }],
          },
        }),
      ]);

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      summary: {
        totalCount,
        totalAmount: Number(amountAggregate._sum.totalPrice ?? 0),
        pendingCount,
        shippingCount,
        cancelledCount,
      },
    };
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