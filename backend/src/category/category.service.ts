import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { id: 'asc' }],
    });
  }

  async getCategoryById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const normalizedParentId = dto.parentId ? Number(dto.parentId) : null;

    if (normalizedParentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: normalizedParentId },
      });

      if (!parent) {
        throw new NotFoundException('부모 카테고리를 찾을 수 없습니다.');
      }
    }

    const existing = await this.prisma.category.findFirst({
      where: {
        name: dto.name,
        parentId: normalizedParentId,
      },
    });

    if (existing) {
      throw new BadRequestException('같은 이름의 카테고리가 이미 존재합니다.');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        parentId: normalizedParentId,
      },
    });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    const normalizedParentId =
      dto.parentId !== undefined ? Number(dto.parentId) : category.parentId;

    if (normalizedParentId) {
      if (Number(id) === normalizedParentId) {
        throw new BadRequestException('자기 자신을 부모 카테고리로 지정할 수 없습니다.');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: normalizedParentId },
      });

      if (!parent) {
        throw new NotFoundException('부모 카테고리를 찾을 수 없습니다.');
      }
    }

    return this.prisma.category.update({
      where: { id: Number(id) },
      data: {
        name: dto.name ?? category.name,
        parentId:
          dto.parentId !== undefined ? normalizedParentId ?? null : category.parentId,
      },
    });
  }

  async deleteCategory(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    const hasChildren = await this.prisma.category.count({
      where: {
        parentId: Number(id),
      },
    });

    if (hasChildren > 0) {
      throw new BadRequestException('하위 카테고리가 있어 삭제할 수 없습니다.');
    }

    const productCount = await this.prisma.product.count({
      where: {
        categoryId: Number(id),
      },
    });

    if (productCount > 0) {
      throw new BadRequestException('상품이 연결된 카테고리는 삭제할 수 없습니다.');
    }

    await this.prisma.category.delete({
      where: { id: Number(id) },
    });

    return { message: '카테고리가 삭제되었습니다.' };
  }
}