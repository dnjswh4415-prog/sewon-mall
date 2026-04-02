import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async getMyAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId: Number(userId) },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
  }

  async createAddress(userId: number, dto: CreateAddressDto) {
    const normalizedUserId = Number(userId);

    if (!normalizedUserId || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId: normalizedUserId },
          data: { isDefault: false },
        });
      }

      const hasAnyAddress = await tx.address.count({
        where: { userId: normalizedUserId },
      });

      return tx.address.create({
        data: {
          userId: normalizedUserId,
          recipient: dto.recipient,
          phone: dto.phone,
          zipcode: dto.zipcode,
          address1: dto.address1,
          address2: dto.address2,
          isDefault: hasAnyAddress === 0 ? true : !!dto.isDefault,
        },
      });
    });
  }

  async updateAddress(userId: number, addressId: number, dto: UpdateAddressDto) {
    const normalizedUserId = Number(userId);
    const normalizedAddressId = Number(addressId);

    const address = await this.prisma.address.findFirst({
      where: {
        id: normalizedAddressId,
        userId: normalizedUserId,
      },
    });

    if (!address) {
      throw new NotFoundException('배송지를 찾을 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: { userId: normalizedUserId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: normalizedAddressId },
        data: {
          recipient: dto.recipient ?? address.recipient,
          phone: dto.phone ?? address.phone,
          zipcode: dto.zipcode ?? address.zipcode,
          address1: dto.address1 ?? address.address1,
          address2: dto.address2 ?? address.address2,
          isDefault:
            dto.isDefault !== undefined ? dto.isDefault : address.isDefault,
        },
      });
    });
  }

  async deleteAddress(userId: number, addressId: number) {
    const normalizedUserId = Number(userId);
    const normalizedAddressId = Number(addressId);

    const address = await this.prisma.address.findFirst({
      where: {
        id: normalizedAddressId,
        userId: normalizedUserId,
      },
    });

    if (!address) {
      throw new NotFoundException('배송지를 찾을 수 없습니다.');
    }

    const orderCount = await this.prisma.order.count({
      where: {
        addressId: normalizedAddressId,
      },
    });

    if (orderCount > 0) {
      throw new BadRequestException('주문에 사용된 배송지는 삭제할 수 없습니다.');
    }

    await this.prisma.address.delete({
      where: { id: normalizedAddressId },
    });

    if (address.isDefault) {
      const latestAddress = await this.prisma.address.findFirst({
        where: { userId: normalizedUserId },
        orderBy: { id: 'desc' },
      });

      if (latestAddress) {
        await this.prisma.address.update({
          where: { id: latestAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: '배송지가 삭제되었습니다.' };
  }

  async setDefaultAddress(userId: number, addressId: number) {
    const normalizedUserId = Number(userId);
    const normalizedAddressId = Number(addressId);

    const address = await this.prisma.address.findFirst({
      where: {
        id: normalizedAddressId,
        userId: normalizedUserId,
      },
    });

    if (!address) {
      throw new NotFoundException('배송지를 찾을 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: normalizedUserId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: normalizedAddressId },
        data: { isDefault: true },
      });
    });
  }
}