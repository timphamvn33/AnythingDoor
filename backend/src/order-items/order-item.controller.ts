import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { JwtAuthGuard } from '@src/auth/use-cases/guards/jwt-auth.guard';

@Controller('order-items')
export class OrderItemController {
  constructor(private readonly orderItemService: OrderItemService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  createOrderItem(@Body() body: CreateOrderItemDto) {
    return this.orderItemService.createOrderItem(body);
  }

  @Get(':id')
  getOrderItemByID(@Param('id') id: string) {
    return this.orderItemService.findOrderItemById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update/:id')
  updateOrderItem(@Param('id') id: string, @Body() body: UpdateOrderItemDto) {
    return this.orderItemService.updateOrderItem(body, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteRestaurant(@Param('id') id: string) {
    return this.orderItemService.deleteOrderItemById(id);
  }
}
