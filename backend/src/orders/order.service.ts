import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderDto } from './dto/update-order.dto';
import type { CreateOrderItemDto } from '@src/order-items/dto/create-order-item.dto';
import { OrderStatus } from '@db/generated/prisma/client';

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
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: true,
      },
    });

    return orders;
  }

  async findOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    return order;
  }

  async initOrAddItem(userId: string, itemData: CreateOrderItemDto) {
    let order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.pending },
      include: { orderItems: true },
    });

    if (!order) {
      const newOrderData: CreateOrderDto = {
          userId: userId,
          status: OrderStatus.pending,
          total: 0,
          paymentId: null,
          addressId: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        order = await this.prisma.order.create({
          data: newOrderData,
        });
    }

    const item = await this.prisma.orderItem.create({
      data: {
        ...itemData,
        orderId: order.id,
      },
    });

    // Update total
    const updatedTotal = order.total + item.price * item.quantity;
    await this.prisma.order.update({
      where: { id: order.id },
      data: { total: updatedTotal },
    });

    return { orderId: order.id, item };
  }
}
