import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import type { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) {}

  async createMenuItem(data: CreateMenuItemDto) {
    if (!data.imgUrl?.trim()) {
      throw new BadRequestException('An image URL is required to create a menu item');
    }

    if (!data.restaurantId?.trim()) {
      throw new BadRequestException('A restaurant ID is required to create a menu item');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${data.restaurantId} not found`);
    }

    return this.prisma.menuItem.create({
      data: {
        name: data.name,
        ...(data.description !== undefined ? { description: data.description } : {}),
        price: data.price,
        ...(data.available !== undefined ? { available: data.available } : {}),
        imgUrl: data.imgUrl,
        category: data.category,
        restaurantId: data.restaurantId,
      },
    });
  }

  async updateMenuItem(dto: UpdateMenuItemDto, id: string) {
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async deleteMenuItemById(id: string): Promise<void> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu Item with Id ${id} not found`);
    }

    await this.prisma.menuItem.delete({
      where: { id: id },
    });
  }

  async findMenuItemByRestaurantId(restaurantId: string) {
    return this.prisma.menuItem.findFirst({
      where: { restaurantId: restaurantId },
    });
  }

  async findAllMenuItemByRestaurantId(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId: restaurantId },
    });
  }

  async findMenuItemById(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return menuItem;
  }

  async findAllMenuItem() {
    return this.prisma.menuItem.findMany({
      include: {
        restaurant: true,
      },
    });
  }
}
