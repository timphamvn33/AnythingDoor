import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async createDelivery(dto: CreateDeliveryDto) {
    return this.prisma.delivery.create({
      data: dto,
    });
  }

  async updateDelivery(id: string, dto: UpdateDeliveryDto) {
    const existing = await this.prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    return this.prisma.delivery.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDelivery(id: string): Promise<void> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    await this.prisma.delivery.delete({
      where: { id },
    });
  }

  async findAllDeliveries() {
    return this.prisma.delivery.findMany();
  }

  async findDeliveryById(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    return delivery;
  }

  async findDeliveriesByDriverId(driverId: string) {
    return this.prisma.delivery.findMany({
      where: { driverId },
    });
  }

  async findDeliveryByOrderId(orderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery for Order ID ${orderId} not found`);
    }

    return delivery;
  }
}
