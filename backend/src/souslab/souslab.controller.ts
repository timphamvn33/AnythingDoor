import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/use-cases/guards/jwt-auth.guard';
import { User } from '@src/user/decorators/user.decorator';
import { SousLabService } from './souslab.service';

@Controller('souslab')
export class SousLabController {
  constructor(private readonly sousLab: SousLabService) {}

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  usage(@User('userId') userId: string) {
    return this.sousLab.getUsage(userId);
  }

  @Get('restaurants')
  search(@Query('zip') zip: string, @Query('name') name = '', @Query('cursor') cursor?: string) {
    return this.sousLab.search(zip, name, cursor);
  }

  @Get('menu')
  menu(@Query('id') id: string) {
    return this.sousLab.menu(id);
  }

  @Get('restaurant')
  restaurant(@Query('id') id: string) {
    return this.sousLab.restaurant(id);
  }
}
