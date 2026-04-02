import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseIntPipe,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductImageService } from './product-image.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';
import { CreateProductImageDto } from './dto/create-product.dto';
import { UpdateProductImageDto } from './dto/update-product.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Express } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

function ensureUploadDir() {
  const uploadPath = join(process.cwd(), 'uploads', 'products');

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
}

function createFileName(
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = extname(file.originalname);
  callback(null, `product-${uniqueSuffix}${extension}`);
}

@Controller('product-images')
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  @Get('product/:productId')
  getProductImages(@Param('productId', ParseIntPipe) productId: number) {
    return this.productImageService.getProductImages(productId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  createProductImage(@Body() dto: CreateProductImageDto) {
    return this.productImageService.createProductImage(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  updateProductImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImageService.updateProductImage(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':imageId/main/:productId')
  setMainProductImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productImageService.setMainProductImage(productId, imageId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  deleteProductImage(@Param('id', ParseIntPipe) id: number) {
    return this.productImageService.deleteProductImage(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('upload/main/:productId')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => cb(null, ensureUploadDir()),
        filename: createFileName,
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('이미지 파일만 업로드 가능합니다.') as any,
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadMainImage(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('업로드된 파일이 없습니다.');
    }

    const imageUrl = `/uploads/products/${file.filename}`;
    return this.productImageService.uploadMainImage(productId, imageUrl);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('upload/sub/:productId')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => cb(null, ensureUploadDir()),
        filename: createFileName,
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('이미지 파일만 업로드 가능합니다.') as any,
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadSubImages(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('sortOrder') sortOrder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드된 파일이 없습니다.');
    }

    const imageUrls = files.map(
      (file) => `/uploads/products/${file.filename}`,
    );

    return this.productImageService.uploadSubImages(
      productId,
      imageUrls,
      Number(sortOrder ?? 1),
    );
  }
}