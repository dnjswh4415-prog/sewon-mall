import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Controller('notices')
export class NoticeController {
  constructor(private readonly notices: NoticeService) {}

  // 공개된 공지만 로그인 없이 조회할 수 있습니다.
  @Get()
  list(@Query('page') page?: string, @Query('search') search?: string) {
    return this.notices.list(page, search);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  listForAdmin(@Query('page') page?: string, @Query('search') search?: string) {
    return this.notices.list(page, search, true);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.notices.getPublished(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateNoticeDto) {
    return this.notices.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoticeDto,
  ) {
    return this.notices.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notices.remove(id);
  }
}
