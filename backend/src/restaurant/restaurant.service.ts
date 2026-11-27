import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateRestaurantDto, type RestaurantSchedule } from './dto/create-restaurant.dto';
import { Weekday } from '@db/generated/prisma';
import type { UpdateRestaurantDto } from './dto/update-restaurant-profile.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async createRestaurant(data: CreateRestaurantDto, ownerId: string) {
    const { address, hours, ...fields } = data;
    return this.prisma.restaurant.create({
      data: {
        ...fields,
        logoUrl: fields.logoUrl || '',
        owner: { connect: { id: ownerId } },
        ...(address ? { address: { create: address } } : {}),
        ...(hours ? { hours: { create: this.scheduleRows(hours) } } : {}),
      },
      include: { address: true, hours: true },
    });
  }

  async updateRestaurant(id: string, ownerId: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, ownerId } });
    if (!restaurant) throw new NotFoundException('Store not found');
    const { address, hours, ...fields } = dto;
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        ...fields,
        ...(address
          ? { address: restaurant.addressId ? { update: address } : { create: address } }
          : {}),
        ...(hours ? { hours: { deleteMany: {}, create: this.scheduleRows(hours) } } : {}),
      },
      include: { address: true, hours: true },
    });
  }

  private scheduleRows(hours: RestaurantSchedule[]) {
    if (
      !Array.isArray(hours) ||
      !hours.length ||
      hours.some(h => !h || typeof h !== 'object') ||
      new Set(hours.map(h => h.day)).size !== hours.length
    ) {
      throw new BadRequestException('Select at least one distinct opening day');
    }
    return hours.map(({ day, opensAt, closesAt }) => {
      const time = (value: string) => {
        const match = typeof value === 'string' && value.match(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
        if (!match) throw new BadRequestException('Invalid opening hours');
        return new Date(`1970-01-01T${value}:00.000Z`);
      };
      if (!Object.values(Weekday).includes(day))
        throw new BadRequestException('Invalid opening day');
      return { day, opensAt: time(opensAt), closesAt: time(closesAt) };
    });
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
    return this.prisma.restaurant.findMany({
      where: { ownerId: ownerId },
      include: { address: true, hours: true },
    });
  }

  async findRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { address: true, hours: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }
}
