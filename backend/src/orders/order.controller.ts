import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '@src/auth/use-cases/guards/jwt-auth.guard';
import { User } from '@src/user/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@User('id') userId: string, @Body() body: CreateOrderDto) {
    return this.orderService.createOrder(userId, body);
  }

  @Get('user/:userId')
  getOrdersByUser(@Param('userId') userId: string) {
    return this.orderService.findOrderByUserId(userId);
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.findOrderById(id);
  }

  @Post(':id')
  updateOrder(@Param('id') id: string, @Body() body: UpdateOrderDto) {
    return this.orderService.updateOrder(id, body);
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrderById(id);
  }
}
