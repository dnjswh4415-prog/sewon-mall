import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ShipOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  deliveryCompany!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  trackingNumber!: string;
}