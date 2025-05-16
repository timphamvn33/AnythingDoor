import { IsEnum, IsNumber } from 'class-validator';
import { MethodType, PaymentStatus } from '@db/generated/prisma/client';

export class CreatePaymentDto {
  @IsEnum(MethodType)
  method: MethodType;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsNumber()
  total: number;
}
