import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant-profile.dto';
import { JwtAuthGuard } from '@src/auth/use-cases/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/use-cases/guards/roles.guard';
import { Role } from '@db/generated/prisma';
import { Roles } from '@auth/decorators/role.decorators';
import { User } from '../user/decorators/user.decorator';

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.restaurant_owner)
  @Post('create')
  createRestaurant(@User('userId') userId, @Body() body: CreateRestaurantDto) {
    return this.restaurantService.createRestaurant(body, userId);
  }

  @Get(':id')
  getRestaurantByID(@Param('id') id: string) {
    return this.restaurantService.findRestaurantById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.restaurant_owner)
  @Post('update')
  updateRestaurant(@User('userId') userId, @Body() body: UpdateRestaurantDto) {
    return this.restaurantService.updateRestaurant(body, userId);
  }

  // Only admin can delete the restaurant
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(':id')
  deleteRestaurant(@Param('id') id: string) {
    return this.restaurantService.deleteRestaurantById(id);
  }
}
