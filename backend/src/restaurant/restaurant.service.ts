import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import type { UpdateRestaurantDto } from './dto/update-restaurant-profile.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async createRestaurant(data: CreateRestaurantDto, ownerId: string) {
    console.log('ownerId: ', ownerId);
    return this.prisma.restaurant.create({
      data: {
        ...data,
        ownerId,
      },
    });
  }

  async updateRestaurant(data: UpdateRestaurantDto, ownerId: string) {
    const { id, ...updateData } = data;
    return this.prisma.restaurant.update({ where: { id }, data: { ...updateData, ownerId } });
  }

  async deleteRestaurantById(id: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with Id ${id} not found`);
    }

    await this.prisma.restaurant.delete({
      where: { id: id },
    });
  }

  async findRestaurantByOwner(ownerId: string) {
    return this.prisma.restaurant.findFirst({
      where: { ownerId: ownerId },
    });
  }

  async findRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }
}
