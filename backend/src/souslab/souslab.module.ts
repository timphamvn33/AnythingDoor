import { Module } from '@nestjs/common';
import { SousLabController } from './souslab.controller';
import { SousLabService } from './souslab.service';

@Module({
  controllers: [SousLabController],
  providers: [SousLabService],
  exports: [SousLabService],
})
export class SousLabModule {}
