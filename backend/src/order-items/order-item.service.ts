import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import type { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  constructor(private prisma: PrismaService) {}

  async createOrderItem(data: CreateOrderItemDto) {
    return this.prisma.orderItem.create({
      data: data,
    });
  }

  async updateOrderItem(dto: UpdateOrderItemDto, id: string) {
    return this.prisma.orderItem.update({ where: { id }, data: dto });
  }

  async deleteOrderItemById(id: string): Promise<void> {
    const OrderItem = await this.prisma.orderItem.findUnique({
      where: { id },
    });

    if (!OrderItem) {
      throw new NotFoundException(`Order Item with Id ${id} not found`);
    }

    await this.prisma.orderItem.delete({
      where: { id: id },
    });
  }

  async findOrderItemById(id: string) {
    const OrderItem = await this.prisma.orderItem.findUnique({
      where: { id },
    });

    if (!OrderItem) {
      throw new NotFoundException(`Other Item with ID ${id} not found`);
    }

    return OrderItem;
  }
}
