import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  getMyAddresses(@Req() req: any) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.addressService.getMyAddresses(Number(userId));
  }

  @Post()
  createAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.addressService.createAddress(Number(userId), dto);
  }

  @Put(':id')
  updateAddress(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.addressService.updateAddress(
      Number(userId),
      Number(id),
      dto,
    );
  }

  @Patch(':id/default')
  setDefaultAddress(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.addressService.setDefaultAddress(Number(userId), Number(id));
  }

  @Delete(':id')
  deleteAddress(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return this.addressService.deleteAddress(Number(userId), Number(id));
  }
}