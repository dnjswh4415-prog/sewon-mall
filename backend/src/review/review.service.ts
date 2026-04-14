import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const REVIEWABLE_ORDER_STATUSES = ['SHIPPING', 'DELIVERED'];

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // 리뷰 작성
  async createReview(userId: number, dto: CreateReviewDto) {
    const normalizedUserId = Number(userId);
    const normalizedOrderItemId = Number(dto.orderItemId);
    const normalizedRating = Number(dto.rating);

    if (!normalizedUserId || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    if (!normalizedOrderItemId || normalizedOrderItemId < 1) {
      throw new BadRequestException('유효하지 않은 주문 상품입니다.');
    }

    if (!normalizedRating || normalizedRating < 1 || normalizedRating > 5) {
      throw new BadRequestException('평점은 1점부터 5점 사이여야 합니다.');
    }

    if (!dto.comment || !String(dto.comment).trim()) {
      throw new BadRequestException('리뷰 내용을 입력해주세요.');
    }

    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        id: normalizedOrderItemId,
        order: {
          userId: normalizedUserId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        reviews: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!orderItem) {
      throw new BadRequestException('구매한 상품만 리뷰 작성 가능');
    }

    if (!REVIEWABLE_ORDER_STATUSES.includes(String(orderItem.order.status))) {
      throw new BadRequestException(
        '리뷰는 배송중 또는 배송완료 상태에서만 작성할 수 있습니다.',
      );
    }

    if (Array.isArray(orderItem.reviews) && orderItem.reviews.length > 0) {
      throw new BadRequestException('이미 리뷰 작성됨');
    }

    return this.prisma.review.create({
      data: {
        userId: normalizedUserId,
        productId: orderItem.productId,
        orderItemId: normalizedOrderItemId,
        rating: normalizedRating,
        comment: String(dto.comment).trim(),
      },
    });
  }

  // 내 리뷰 1건 조회 (수정 페이지용)
  async getMyReview(userId: number, reviewId: number) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: Number(reviewId),
        userId: Number(userId),
      },
      include: {
        product: true,
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('리뷰 없음');
    }

    return review;
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
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('리뷰 없음');
    }

    const nextRating =
      data.rating !== undefined ? Number(data.rating) : Number(review.rating);

    if (!nextRating || nextRating < 1 || nextRating > 5) {
      throw new BadRequestException('평점은 1점부터 5점 사이여야 합니다.');
    }

    const nextComment =
      data.comment !== undefined ? String(data.comment).trim() : review.comment;

    if (!nextComment || !String(nextComment).trim()) {
      throw new BadRequestException('리뷰 내용을 입력해주세요.');
    }

    return this.prisma.review.update({
      where: { id: Number(reviewId) },
      data: {
        rating: nextRating,
        comment: nextComment,
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