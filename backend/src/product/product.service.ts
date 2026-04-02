import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async getProducts(params?: { categoryId?: number; keyword?: string }) {
    const where: any = {};

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.keyword) {
      where.name = {
        contains: params.keyword,
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        Category: true,
        reviews: true,
        images: true,
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

    return products.map((product) => {
      const reviewCount = product.reviews.length;
      const avgRating =
        reviewCount > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;

      return {
        ...product,
        avgRating,
        reviewCount,
      };
    });
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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
        options: {
          include: {
            values: true,
          },
        },
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

    const reviewCount = product.reviews.length;
    const avgRating =
      reviewCount > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    return {
      ...product,
      avgRating,
      reviewCount,
    };
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
      },
      include: {
        Category: true,
      },
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      include: {
        Category: true,
      },
    });
  }

  async deleteProduct(id: number) {
    const exists = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: '상품이 삭제되었습니다.' };
  }
}