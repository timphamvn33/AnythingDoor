import { Module } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { MenuItemController } from './menu-item.controller';
import { PrismaService } from '@src/prisma/prisma.service';

@Module({
  controllers: [MenuItemController],
  providers: [MenuItemService, PrismaService],
  exports: [MenuItemService],
})
export class MenuItemModule {}
