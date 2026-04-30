import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  private getUserId(req: any) {
    const userId = Number(req.user?.id ?? req.user?.userId ?? req.user?.sub);

    if (!Number.isInteger(userId) || userId < 1) {
      throw new BadRequestException('로그인 정보가 없습니다.');
    }

    return userId;
  }

  @Get()
  getMyAddresses(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.addressService.getMyAddresses(userId);
  }

  @Post()
  createAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    const userId = this.getUserId(req);
    return this.addressService.createAddress(userId, dto);
  }

  @Put(':id')
  updateAddress(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    const userId = this.getUserId(req);
    return this.addressService.updateAddress(userId, id, dto);
  }

  @Patch(':id/default')
  setDefaultAddress(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = this.getUserId(req);
    return this.addressService.setDefaultAddress(userId, id);
  }

  @Delete(':id')
  deleteAddress(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return this.addressService.deleteAddress(userId, id);
  }
}