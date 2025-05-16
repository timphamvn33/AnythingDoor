import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliverStatus } from '@db/generated/prisma/client';

export class CreateDeliveryDto {
  @IsString()
  orderId: string;

  @IsString()
  driverId: string;

  @IsEnum(DeliverStatus)
  status: DeliverStatus;

  @IsDate()
  @IsOptional()
  pickupTime?: Date;

  @IsDate()
  @IsOptional()
  deliveryTime?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}
