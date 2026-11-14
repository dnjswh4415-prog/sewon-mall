import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(pageParam?: string, searchParam?: string, includeDrafts = false) {
    const parsed = Number(pageParam ?? 1);
    const page = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100000) : 1;
    const pageSize = 10;
    const search = String(searchParam ?? '').trim().slice(0, 100);

    const where: Prisma.NoticeWhereInput = includeDrafts
      ? {}
      : { isPublished: true };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notice.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getPublished(id: number) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, isPublished: true },
    });

    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
    return notice;
  }

  async create(dto: CreateNoticeDto) {
    return this.prisma.notice.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        category: dto.category ?? '공지사항',
        isPinned: dto.isPinned ?? false,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateNoticeDto) {
    await this.assertExists(id);
    return this.prisma.notice.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.assertExists(id);
    await this.prisma.notice.delete({ where: { id } });
    return { message: '공지사항이 삭제되었습니다.' };
  }

  private async assertExists(id: number) {
    const exists = await this.prisma.notice.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
  }
}
