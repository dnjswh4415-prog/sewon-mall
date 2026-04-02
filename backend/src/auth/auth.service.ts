import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { FindEmailDto } from './dto/find-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(data: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async checkEmailExists(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return {
      exists: !!user,
    };
  }

  async findEmail(data: FindEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        name: data.name,
        phone: data.phone,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('일치하는 회원 정보를 찾을 수 없습니다.');
    }

    return {
      email: user.email,
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        name: data.name,
        phone: data.phone,
      },
    });

    if (!user) {
      throw new NotFoundException('일치하는 회원 정보를 찾을 수 없습니다.');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }

  async getProfile(userId: number) {
    const normalizedUserId = Number(userId);

    if (!normalizedUserId || normalizedUserId < 1) {
      throw new UnauthorizedException('유효하지 않은 사용자 정보입니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }
}