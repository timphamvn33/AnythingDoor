import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@db/generated/prisma';
import { Roles } from '@auth/decorators/role.decorators';
import { Public } from '@auth/decorators/public.decorators';
import { JwtAuthGuard } from '@src/auth/use-cases/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/use-cases/guards/roles.guard';
import { User } from '@src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import type { ApproveRestaurantDto, ChatRequestDto, OwnerChatRequestDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.chatService.getStatus();
  }

  @Public()
  @Post('buyer')
  recommendRestaurants(@Body() body: ChatRequestDto) {
    return this.chatService.recommendRestaurants(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.restaurant_owner)
  @Post('owner/propose')
  proposeRestaurant(@Body() body: OwnerChatRequestDto) {
    return this.chatService.proposeRestaurant(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.restaurant_owner)
  @Post('owner/approve')
  approveRestaurant(@User('userId') ownerId: string, @Body() body: ApproveRestaurantDto) {
    return this.chatService.approveRestaurant(body, ownerId);
  }
}
