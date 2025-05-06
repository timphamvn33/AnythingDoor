import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { PrismaService } from '@src/prisma/prisma.service';

@Module({
  controllers: [RestaurantController],
  providers: [RestaurantService, PrismaService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
