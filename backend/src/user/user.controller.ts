import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import type { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post()
  createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }
  @Get('test')
  testRoute() {
    return { message: 'GET /users/test is working!' };
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUserbyId(id);
  }
}
