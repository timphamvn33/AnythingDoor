import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { PrismaModule } from '@src/prisma/prisma.module';
import { PrismaService } from '@src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, PrismaService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
