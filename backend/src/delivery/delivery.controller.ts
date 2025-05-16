import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(createDeliveryDto);
  }

  @Get()
  findAll() {
    return this.deliveryService.findAllDeliveries();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.findDeliveryById(id);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.deliveryService.findDeliveryByOrderId(orderId);
  }

  @Get('driver/:driverId')
  findByDriver(@Param('driverId') driverId: string) {
    return this.deliveryService.findDeliveriesByDriverId(driverId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeliveryDto: UpdateDeliveryDto) {
    return this.deliveryService.updateDelivery(id, updateDeliveryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveryService.deleteDelivery(id);
  }
}
