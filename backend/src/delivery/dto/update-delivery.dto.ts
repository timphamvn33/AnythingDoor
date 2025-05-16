import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliverStatus } from '@db/generated/prisma/client';

export class UpdateDeliveryDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  driverId: string;

  @IsEnum(DeliverStatus)
  @IsOptional()
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
