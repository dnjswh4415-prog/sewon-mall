import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  private getUserId(req: any): number {
    const userId = Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);

    if (!userId || userId < 1) {
      throw new BadRequestException('로그인 정보 없음');
    }

    return userId;
  }

  // 리뷰 작성
  @UseGuards(JwtAuthGuard)
  @Post()
  createReview(@Req() req: any, @Body() body: CreateReviewDto) {
    const userId = this.getUserId(req);
    return this.reviewService.createReview(userId, body);
  }

  // 내 리뷰 1건 조회
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getMyReview(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return this.reviewService.getMyReview(userId, id);
  }

  // 상품 리뷰 조회
  @Get('product/:id')
  getReviews(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getProductReviews(id);
  }

  // 상품 평점 조회
  @Get('product/:id/rating')
  getProductRating(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getProductRating(id);
  }

  // 리뷰 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateReview(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReviewDto,
  ) {
    const userId = this.getUserId(req);
    return this.reviewService.updateReview(userId, id, body);
  }

  // 리뷰 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReview(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return this.reviewService.deleteReview(userId, id);
  }
}