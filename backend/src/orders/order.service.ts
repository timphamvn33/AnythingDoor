import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: { ...dto, userId },
    });
  }

  async updateOrder(id: string, dto: UpdateOrderDto) {
    return this.prisma.order.update({ where: { id }, data: dto });
  }

  async deleteOrderById(id: string): Promise<void> {
    const Order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!Order) {
      throw new NotFoundException(`Order with Id ${id} not found`);
    }

    await this.prisma.order.delete({
      where: { id: id },
    });
  }

  async findOrderByUserId(userId: string) {
    const Order = await this.prisma.order.findMany({
      where: { userId },
    });

    if (!Order) {
      throw new NotFoundException(`Other with userId ${userId} not found`);
    }

    return Order;
  }

  async findOrderById(id: string) {
    const Order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!Order) {
      throw new NotFoundException(`Other with ID ${id} not found`);
    }

    return Order;
  }
}
