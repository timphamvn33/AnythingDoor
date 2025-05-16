import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { MethodType, PaymentStatus } from '@db/generated/prisma/client';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(MethodType)
  method: MethodType;

  @IsOptional()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsNumber()
  total: number;
}
