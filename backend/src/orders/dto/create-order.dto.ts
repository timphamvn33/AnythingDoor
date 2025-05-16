import { IsString, IsEnum, IsNumber } from 'class-validator';
import { OrderStatus } from '@db/generated/prisma/client';

export class CreateOrderDto {
  @IsString()
  addressId: string;

  @IsString()
  paymentId: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsNumber()
  total: number;
}
