import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '@src/auth/use-cases/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/use-cases/guards/roles.guard';
import { Role } from '@db/generated/prisma';
import { Roles } from '@auth/decorators/role.decorators';

@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.restaurant_owner)
  @Post('create')
  createMenuItem(@Body() body: CreateMenuItemDto) {
    return this.menuItemService.createMenuItem(body);
  }

  @Get('all')
  getAllMenuItem() {
    return this.menuItemService.findAllMenuItem();
  }

  @Get(':id')
  getMenuItemByID(@Param('id') id: string) {
    return this.menuItemService.findMenuItemById(id);
  }

  @Get('getAllItem/:id')
  getAllMenuItemByID(@Param('id') id: string) {
    return this.menuItemService.findAllMenuItemByRestaurantId(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.restaurant_owner)
  @Post('update/:id')
  updateMenuItem(@Param('id') id: string, @Body() body: UpdateMenuItemDto) {
    return this.menuItemService.updateMenuItem(body, id);
  }

  // Only admin can delete the restaurant
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Roles(Role.restaurant_owner)
  @Delete(':id')
  deleteItem(@Param('id') id: string) {
    return this.menuItemService.deleteMenuItemById(id);
  }
}
