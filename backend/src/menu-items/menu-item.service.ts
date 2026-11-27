import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import type { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) {}

  async createMenuItem(data: CreateMenuItemDto) {
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
        imgUrl: data.imgUrl?.trim() || '',
        ...(data.ingredients !== undefined ? { ingredients: data.ingredients } : {}),
        ...(data.menuSection !== undefined ? { menuSection: data.menuSection } : {}),
        category: data.category,
        restaurantId: data.restaurantId,
      },
    });
  }

  async updateMenuItem(dto: UpdateMenuItemDto, id: string) {
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async renameSection(
    storeId: string,
    ownerId: string,
    body: { section: string | null; title: string },
  ) {
    if (
      !body ||
      (body.section !== null && (typeof body.section !== 'string' || !body.section)) ||
      typeof body.title !== 'string' ||
      !body.title.trim()
    ) {
      throw new BadRequestException('A valid section and title are required');
    }
    const title = body.title.trim();
    if (title.toLowerCase() === 'menu items') {
      throw new BadRequestException('That table title is reserved');
    }
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: storeId, ownerId } });
    if (!restaurant) throw new NotFoundException('Store not found');
    const existing = await this.prisma.menuItem.findFirst({
      where: {
        restaurantId: storeId,
        menuSection: { equals: title, mode: 'insensitive' },
        NOT: { menuSection: body.section },
      },
    });
    if (existing) throw new BadRequestException('A table with that title already exists');
    const result = await this.prisma.menuItem.updateMany({
      where: {
        restaurantId: storeId,
        ...(body.section === null
          ? { OR: [{ menuSection: null }, { menuSection: '' }] }
          : { menuSection: body.section }),
      },
      data: { menuSection: title },
    });
    if (!result.count) throw new NotFoundException('Menu table not found');
    return result;
  }

  async deleteSection(storeId: string, ownerId: string, body: { section: string | null }) {
    if (!body || (body.section !== null && (typeof body.section !== 'string' || !body.section))) {
      throw new BadRequestException('A valid section is required');
    }

    return this.prisma.$transaction(async tx => {
      const restaurant = await tx.restaurant.findFirst({ where: { id: storeId, ownerId } });
      if (!restaurant) throw new NotFoundException('Store not found');
      const where = {
        restaurantId: storeId,
        ...(body.section === null
          ? { OR: [{ menuSection: null }, { menuSection: '' }] }
          : { menuSection: body.section }),
      };
      const items = await tx.menuItem.findMany({ where, select: { id: true, name: true } });
      for (const item of items) {
        await tx.orderItem.updateMany({
          where: { menuItemId: item.id, itemName: null },
          data: { itemName: item.name },
        });
      }
      return tx.menuItem.deleteMany({ where });
    }, { isolationLevel: 'Serializable' });
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
