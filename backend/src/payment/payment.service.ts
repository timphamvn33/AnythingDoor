import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: dto,
    });
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    return this.prisma.payment.update({ where: { id }, data: dto });
  }

  async deletePaymentById(id: string): Promise<void> {
    const Payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!Payment) {
      throw new NotFoundException(`Payment with Id ${id} not found`);
    }

    await this.prisma.payment.delete({
      where: { id: id },
    });
  }

  async findPaymentById(id: string) {
    const Payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!Payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return Payment;
  }
}
