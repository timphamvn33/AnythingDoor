import { Module } from '@nestjs/common';
import { OpenMenuController } from './openmenu.controller';
import { OpenMenuService } from './openmenu.service';

@Module({
  controllers: [OpenMenuController],
  providers: [OpenMenuService],
})
export class OpenMenuModule {}
