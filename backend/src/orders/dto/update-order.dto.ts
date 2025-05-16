import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { OrderStatus } from '@db/generated/prisma/client';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  addressId: string;

  @IsOptional()
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsNumber()
  total: number;
}
