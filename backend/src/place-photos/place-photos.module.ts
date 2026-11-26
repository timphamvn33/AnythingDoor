import { Module } from '@nestjs/common';
import { PrismaModule } from '@src/prisma/prisma.module';
import { SousLabModule } from '@src/souslab/souslab.module';
import { PlacePhotosController } from './place-photos.controller';
import { PlacePhotosService } from './place-photos.service';

@Module({
  imports: [PrismaModule, SousLabModule],
  controllers: [PlacePhotosController],
  providers: [PlacePhotosService],
})
export class PlacePhotosModule {}
