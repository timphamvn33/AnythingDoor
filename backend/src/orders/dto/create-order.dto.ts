import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { OrderStatus } from '@db/generated/prisma/client';

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  addressId: string | undefined;

  @IsString()
  userId: string | undefined;

  @IsString()
  @IsOptional()
  paymentId: string | undefined;

  @IsEnum(OrderStatus)
  status: OrderStatus | undefined;

  @IsNumber()
  total: number | undefined;
}
