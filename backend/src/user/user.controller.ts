import { Body, Controller, Get, Param, Post, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@auth/use-cases/guards/jwt-auth.guard';
import type { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '@auth/decorators/role.decorators';
import { RolesGuard } from '@auth/use-cases/guards/roles.guard';
import { Role } from '@db/generated/prisma/client';
import { User } from '../user/decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@User() user) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('update_profile')
  updateProfile(@User('userId') userId, @Body() data: UpdateUserDto) {
    return this.userService.updateUser(data, userId);
  }

  // only admin can delete the user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUserById(id);
  }
}
