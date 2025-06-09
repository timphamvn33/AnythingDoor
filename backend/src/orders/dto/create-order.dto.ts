import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { OrderStatus } from '@db/generated/prisma/client';

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  addressId: string;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  paymentId: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsNumber()
  total: number;
}
