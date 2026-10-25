import { IsEnum, IsNumber } from 'class-validator';
import { MethodType, PaymentStatus } from '@db/generated/prisma/client';
import { UUID } from 'crypto';

export class CreatePaymentDto {
  @IsEnum(MethodType)
  method: MethodType | undefined;

  @IsNumber()
  amount: number | undefined;

  @IsEnum(PaymentStatus)
  status: PaymentStatus | undefined;

  @IsNumber()
  total: number | undefined;
}
