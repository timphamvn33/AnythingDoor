import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import type { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) {}

  async createMenuItem(data: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: data,
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

  async findMenuItemById(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return menuItem;
  }
}
