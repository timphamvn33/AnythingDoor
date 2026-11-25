import { Controller, Get, Query } from '@nestjs/common';
import { OpenMenuService } from './openmenu.service';

@Controller('openmenu')
export class OpenMenuController {
  constructor(private readonly openMenu: OpenMenuService) {}

  @Get('restaurants')
  search(@Query('zip') zip: string, @Query('name') name = '') {
    return this.openMenu.search(zip, name);
  }

  @Get('menu')
  menu(@Query('id') id: string) {
    return this.openMenu.menu(id);
  }
}
