import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { expandSearchKeywords } from './search-keyword-map';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private enrichProductSummary(product: any) {
    const reviewCount = product.reviews.length;
    const avgRating =
      reviewCount > 0
        ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviewCount
        : 0;

    return {
      ...product,
      avgRating,
      reviewCount,
    };
  }

  private getProductPrice(product: any) {
    const variantPrices =
      product?.variants
        ?.filter((variant: any) => variant?.isActive)
        ?.map((variant: any) => Number(variant?.price ?? 0))
        ?.filter((price: number) => Number.isFinite(price) && price > 0) ?? [];

    if (variantPrices.length > 0) {
      return Math.min(...variantPrices);
    }

    return Number(product?.price ?? 0);
  }

  private getProductOptionTokens(product: any): string[] {
    const tokens = new Set<string>();

    for (const option of product?.options ?? []) {
      if (option?.name) {
        tokens.add(`option:${String(option.name).trim().toLowerCase()}`);
      }

      for (const value of option?.values ?? []) {
        if (value?.value) {
          tokens.add(`value:${String(value.value).trim().toLowerCase()}`);
        }
      }
    }

    return [...tokens];
  }

  private calculateRelationScore(base: any, target: any): number {
    let score = 0;

    if (Number(base.id) === Number(target.id)) {
      return 0;
    }

    if (
      base.categoryId != null &&
      target.categoryId != null &&
      Number(base.categoryId) === Number(target.categoryId)
    ) {
      score += 5;
    }

    const baseTokens = new Set(this.getProductOptionTokens(base));
    const targetTokens = this.getProductOptionTokens(target);

    for (const token of targetTokens) {
      if (baseTokens.has(token)) {
        score += token.startsWith('value:') ? 2 : 1;
      }
    }

    const basePrice = this.getProductPrice(base);
    const targetPrice = this.getProductPrice(target);

    if (basePrice > 0 && targetPrice > 0) {
      const diffRatio = Math.abs(basePrice - targetPrice) / basePrice;

      if (diffRatio <= 0.15) {
        score += 3;
      } else if (diffRatio <= 0.3) {
        score += 2;
      } else if (diffRatio <= 0.5) {
        score += 1;
      }
    }

    return score;
  }

  private buildProductGraph(products: any[]) {
    const graph = new Map<number, Array<{ id: number; score: number }>>();

    for (const product of products) {
      graph.set(Number(product.id), []);
    }

    for (let i = 0; i < products.length; i += 1) {
      for (let j = i + 1; j < products.length; j += 1) {
        const a = products[i];
        const b = products[j];

        const score = this.calculateRelationScore(a, b);

        if (score >= 4) {
          graph.get(Number(a.id))?.push({ id: Number(b.id), score });
          graph.get(Number(b.id))?.push({ id: Number(a.id), score });
        }
      }
    }

    for (const [, neighbors] of graph) {
      neighbors.sort((x, y) => y.score - x.score);
    }

    return graph;
  }

  private async getRecommendationBaseProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        Category: true,
        reviews: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        detailImages: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        regionalPrices: {
          where: {
            isActive: true,
          },
        },
        options: {
          include: {
            values: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          include: {
            regionalPrices: {
              where: {
                isActive: true,
              },
            },
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
      orderBy: {
        id: 'desc',
      },
    });

    return products;
  }

  async getProducts(params?: { categoryId?: number; keyword?: string }) {
    const keywords = expandSearchKeywords(params?.keyword);

    const andConditions: Prisma.ProductWhereInput[] = [];

    if (params?.categoryId) {
      andConditions.push({
        categoryId: Number(params.categoryId),
      });
    }

    if (keywords.length > 0) {
      const searchOr: Prisma.ProductWhereInput[] = keywords.flatMap(
        (keyword) => [
          {
            name: {
              contains: keyword,
            },
          },
          {
            description: {
              contains: keyword,
            },
          },
          {
            Category: {
              is: {
                name: {
                  contains: keyword,
                },
              },
            },
          },
          {
            options: {
              some: {
                name: {
                  contains: keyword,
                },
              },
            },
          },
          {
            options: {
              some: {
                values: {
                  some: {
                    value: {
                      contains: keyword,
                    },
                  },
                },
              },
            },
          },
        ],
      );

      andConditions.push({
        OR: searchOr,
      });
    }

    const where: Prisma.ProductWhereInput =
      andConditions.length > 0
        ? {
            AND: andConditions,
          }
        : {};

    const products = await this.prisma.product.findMany({
      where,
      include: {
        Category: true,
        reviews: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        detailImages: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        regionalPrices: {
          where: {
            isActive: true,
          },
        },
        options: {
          include: {
            values: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          include: {
            regionalPrices: {
              where: {
                isActive: true,
              },
            },
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
      orderBy: {
        id: 'desc',
      },
    });

    return products.map((product) => this.enrichProductSummary(product));
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        Category: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            images: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        detailImages: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        regionalPrices: {
          where: {
            isActive: true,
          },
        },
        options: {
          include: {
            values: true,
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            regionalPrices: {
              where: {
                isActive: true,
              },
            },
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

    return this.enrichProductSummary(product);
  }

  async recordProductView(userId: number, productId: number) {
    const normalizedUserId = Number(userId);
    const normalizedProductId = Number(productId);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: normalizedProductId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return this.prisma.productViewHistory.create({
      data: {
        userId: normalizedUserId,
        productId: normalizedProductId,
      },
    });
  }

  async getBfsRecommendationsByProduct(productId: number, limit = 8) {
    const normalizedProductId = Number(productId);
    const products = await this.getRecommendationBaseProducts();

    const baseProduct = products.find(
      (product) => Number(product.id) === normalizedProductId,
    );

    if (!baseProduct) {
      throw new NotFoundException('기준 상품을 찾을 수 없습니다.');
    }

    const graph = this.buildProductGraph(products);
    const visited = new Set<number>([normalizedProductId]);
    const queue: number[] = [normalizedProductId];
    const recommendedIds: number[] = [];

    while (queue.length > 0 && recommendedIds.length < limit) {
      const currentId = queue.shift()!;
      const neighbors = graph.get(currentId) ?? [];

      for (const neighbor of neighbors) {
        if (visited.has(neighbor.id)) continue;

        visited.add(neighbor.id);
        queue.push(neighbor.id);

        if (neighbor.id !== normalizedProductId) {
          recommendedIds.push(neighbor.id);
        }

        if (recommendedIds.length >= limit) break;
      }
    }

    const recommendedProducts = recommendedIds
      .map((id) => products.find((product) => Number(product.id) === id))
      .filter(Boolean)
      .slice(0, limit);

    return recommendedProducts.map((product: any) =>
      this.enrichProductSummary(product),
    );
  }

  async getBfsRecommendationsByUser(userId: number, limit = 8) {
    const normalizedUserId = Number(userId);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    const recentViews = await this.prisma.productViewHistory.findMany({
      where: {
        userId: normalizedUserId,
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: 50,
    });

    if (recentViews.length === 0) {
      return [];
    }

    const frequencyMap = new Map<number, number>();

    for (const view of recentViews) {
      const current = frequencyMap.get(Number(view.productId)) ?? 0;
      frequencyMap.set(Number(view.productId), current + 1);
    }

    const seedIds = [...frequencyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([productId]) => productId);

    const products = await this.getRecommendationBaseProducts();
    const graph = this.buildProductGraph(products);

    const visited = new Set<number>(seedIds);
    const queue: number[] = [...seedIds];
    const recommendedIds: number[] = [];

    while (queue.length > 0 && recommendedIds.length < limit) {
      const currentId = queue.shift()!;
      const neighbors = graph.get(currentId) ?? [];

      for (const neighbor of neighbors) {
        if (visited.has(neighbor.id)) continue;

        visited.add(neighbor.id);
        queue.push(neighbor.id);

        if (!seedIds.includes(neighbor.id)) {
          recommendedIds.push(neighbor.id);
        }

        if (recommendedIds.length >= limit) break;
      }
    }

    const recommendedProducts = recommendedIds
      .map((id) => products.find((product) => Number(product.id) === id))
      .filter(Boolean)
      .slice(0, limit);

    return recommendedProducts.map((product: any) =>
      this.enrichProductSummary(product),
    );
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock: dto.stock,
          imageUrl: dto.imageUrl,
          categoryId: dto.categoryId,
        },
      });

      if (Array.isArray(dto.detailImageUrls) && dto.detailImageUrls.length > 0) {
        await tx.productDetailImage.createMany({
          data: dto.detailImageUrls
            .filter((imageUrl) => String(imageUrl).trim() !== '')
            .map((imageUrl, index) => ({
              productId: product.id,
              imageUrl,
              sortOrder: index,
            })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          Category: true,
          detailImages: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          regionalPrices: {
            where: {
              isActive: true,
            },
          },
        },
      });
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!exists) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: Number(id) },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        },
      });

      if (dto.detailImageUrls !== undefined) {
        await tx.productDetailImage.deleteMany({
          where: { productId: Number(id) },
        });

        const filteredDetailImages = dto.detailImageUrls.filter(
          (imageUrl) => String(imageUrl).trim() !== '',
        );

        if (filteredDetailImages.length > 0) {
          await tx.productDetailImage.createMany({
            data: filteredDetailImages.map((imageUrl, index) => ({
              productId: Number(id),
              imageUrl,
              sortOrder: index,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id: Number(id) },
        include: {
          Category: true,
          detailImages: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          regionalPrices: {
            where: {
              isActive: true,
            },
          },
        },
      });
    });
  }

  async deleteProduct(id: number) {
    const exists = await this.prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!exists) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    await this.prisma.product.delete({
      where: { id: Number(id) },
    });

    return { message: '상품이 삭제되었습니다.' };
  }
}