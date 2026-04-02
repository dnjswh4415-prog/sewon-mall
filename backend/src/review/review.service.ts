import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // 리뷰 작성
  async createReview(userId: number, dto: CreateReviewDto) {
    const normalizedUserId = Number(userId);
    const normalizedOrderItemId = Number(dto.orderItemId);
    const normalizedRating = Number(dto.rating);

    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        id: normalizedOrderItemId,
        order: {
          userId: normalizedUserId,
        },
      },
    });

    if (!orderItem) {
      throw new BadRequestException('구매한 상품만 리뷰 작성 가능');
    }

    const existing = await this.prisma.review.findUnique({
      where: { orderItemId: normalizedOrderItemId },
    });

    if (existing) {
      throw new BadRequestException('이미 리뷰 작성됨');
    }

    return this.prisma.review.create({
      data: {
        userId: normalizedUserId,
        productId: orderItem.productId,
        orderItemId: normalizedOrderItemId,
        rating: normalizedRating,
        comment: dto.comment,
      },
    });
  }

  // 상품 리뷰 조회
  async getProductReviews(productId: number) {
    return this.prisma.review.findMany({
      where: { productId: Number(productId) },
      include: {
        user: {
          select: { name: true },
        },
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 상품 평균 평점
  async getProductRating(productId: number) {
    const result = await this.prisma.review.aggregate({
      where: { productId: Number(productId) },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      avgRating: result._avg.rating ?? 0,
      reviewCount: result._count.rating,
    };
  }

  // 리뷰 수정
  async updateReview(userId: number, reviewId: number, data: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: Number(reviewId),
        userId: Number(userId),
      },
    });

    if (!review) {
      throw new NotFoundException('리뷰 없음');
    }

    return this.prisma.review.update({
      where: { id: Number(reviewId) },
      data: {
        rating: data.rating ?? review.rating,
        comment: data.comment ?? review.comment,
      },
    });
  }

  // 리뷰 삭제
  async deleteReview(userId: number, reviewId: number) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: Number(reviewId),
        userId: Number(userId),
      },
    });

    if (!review) {
      throw new NotFoundException('리뷰 없음');
    }

    await this.prisma.review.delete({
      where: { id: Number(reviewId) },
    });

    return { message: '리뷰 삭제 완료' };
  }
}