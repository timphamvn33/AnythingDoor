import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('suggestions')
  suggestions(@Query('q') query: string) {
    return this.discovery.suggestions(query);
  }

  @Post('search')
  search(@Body() body: unknown) {
    return this.discovery.search(body);
  }

  @Post('saved')
  saved(@Body() body: unknown) {
    return this.discovery.saved(body);
  }
}
