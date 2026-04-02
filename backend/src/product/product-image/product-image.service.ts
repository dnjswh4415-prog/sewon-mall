import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductImage } from '@prisma/client';
import { CreateProductImageDto } from './dto/create-product.dto';
import { UpdateProductImageDto } from './dto/update-product.dto';

@Injectable()
export class ProductImageService {
  constructor(private prisma: PrismaService) {}

  private async ensureProductExists(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return product;
  }

  async getProductImages(productId: number) {
    await this.ensureProductExists(productId);

    return this.prisma.productImage.findMany({
      where: {
        productId: Number(productId),
      },
      orderBy: [
        { isMain: 'desc' },
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  async createProductImage(dto: CreateProductImageDto) {
    const productId = Number(dto.productId);
    await this.ensureProductExists(productId);

    if (dto.isMain) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { isMain: false },
      });
    }

    const createdImage = await this.prisma.productImage.create({
      data: {
        productId,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isMain: dto.isMain ?? false,
      },
    });

    if (dto.isMain) {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          imageUrl: dto.imageUrl,
        },
      });
    }

    return createdImage;
  }

  async updateProductImage(id: number, dto: UpdateProductImageDto) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: Number(id) },
    });

    if (!image) {
      throw new NotFoundException('상품 이미지를 찾을 수 없습니다.');
    }

    if (image.isMain && dto.isMain === false) {
      throw new BadRequestException(
        '대표 이미지는 다른 이미지를 대표로 지정한 후 변경하세요.',
      );
    }

    const nextImageUrl = dto.imageUrl ?? image.imageUrl;
    const nextSortOrder = dto.sortOrder ?? image.sortOrder;
    const nextIsMain = dto.isMain ?? image.isMain;

    if (nextIsMain) {
      await this.prisma.productImage.updateMany({
        where: {
          productId: image.productId,
        },
        data: {
          isMain: false,
        },
      });
    }

    const updatedImage = await this.prisma.productImage.update({
      where: { id: Number(id) },
      data: {
        imageUrl: nextImageUrl,
        sortOrder: nextSortOrder,
        isMain: nextIsMain,
      },
    });

    if (nextIsMain) {
      await this.prisma.product.update({
        where: { id: image.productId },
        data: {
          imageUrl: nextImageUrl,
        },
      });
    } else if (image.isMain && dto.imageUrl) {
      await this.prisma.product.update({
        where: { id: image.productId },
        data: {
          imageUrl: nextImageUrl,
        },
      });
    }

    return updatedImage;
  }

  async setMainProductImage(productId: number, imageId: number) {
    const normalizedProductId = Number(productId);
    const normalizedImageId = Number(imageId);

    await this.ensureProductExists(normalizedProductId);

    const image = await this.prisma.productImage.findUnique({
      where: { id: normalizedImageId },
    });

    if (!image || image.productId !== normalizedProductId) {
      throw new NotFoundException('상품 이미지를 찾을 수 없습니다.');
    }

    await this.prisma.productImage.updateMany({
      where: { productId: normalizedProductId },
      data: { isMain: false },
    });

    await this.prisma.productImage.update({
      where: { id: normalizedImageId },
      data: { isMain: true },
    });

    await this.prisma.product.update({
      where: { id: normalizedProductId },
      data: {
        imageUrl: image.imageUrl,
      },
    });

    return {
      message: '대표 이미지가 변경되었습니다.',
    };
  }

  async deleteProductImage(id: number) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: Number(id) },
    });

    if (!image) {
      throw new NotFoundException('상품 이미지를 찾을 수 없습니다.');
    }

    const productId = image.productId;
    const wasMain = image.isMain;

    await this.prisma.productImage.delete({
      where: { id: Number(id) },
    });

    if (wasMain) {
      const nextImage = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });

      if (nextImage) {
        await this.prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isMain: true },
        });

        await this.prisma.product.update({
          where: { id: productId },
          data: { imageUrl: nextImage.imageUrl },
        });
      } else {
        await this.prisma.product.update({
          where: { id: productId },
          data: { imageUrl: null },
        });
      }
    }

    return { message: '상품 이미지가 삭제되었습니다.' };
  }

  async uploadMainImage(productId: number, imageUrl: string) {
    const normalizedProductId = Number(productId);
    await this.ensureProductExists(normalizedProductId);

    await this.prisma.productImage.updateMany({
      where: { productId: normalizedProductId },
      data: { isMain: false },
    });

    const createdImage = await this.prisma.productImage.create({
      data: {
        productId: normalizedProductId,
        imageUrl,
        sortOrder: 0,
        isMain: true,
      },
    });

    await this.prisma.product.update({
      where: { id: normalizedProductId },
      data: {
        imageUrl,
      },
    });

    return {
      message: '대표 이미지가 업로드되었습니다.',
      image: createdImage,
      imageUrl,
    };
  }

  async uploadSubImages(
    productId: number,
    imageUrls: string[],
    startSortOrder = 1,
  ) {
    const normalizedProductId = Number(productId);
    await this.ensureProductExists(normalizedProductId);

    const createdImages: ProductImage[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const createdImage = await this.prisma.productImage.create({
        data: {
          productId: normalizedProductId,
          imageUrl: imageUrls[i],
          sortOrder: startSortOrder + i,
          isMain: false,
        },
      });

      createdImages.push(createdImage);
    }

    return {
      message: '추가 이미지가 업로드되었습니다.',
      images: createdImages,
    };
  }
}