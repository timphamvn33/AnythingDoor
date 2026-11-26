import { Controller, Get, Header, Query } from '@nestjs/common';
import { PlacePhotosService } from './place-photos.service';

@Controller('place-photos')
export class PlacePhotosController {
  constructor(private readonly photos: PlacePhotosService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  photo(@Query('source') source: string, @Query('id') id: string) {
    return this.photos.photo(source, id);
  }
}
