import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../use-cases/services/auth.service';
import { JwtAuthGuard } from '../use-cases/guards/jwt-auth.guard';
import { LoginDto } from '../use-cases/dto/login.dto';
import { Public } from '../decorators/public.decorators';
import type { SignupDto } from '../use-cases/dto/signup.dto';
import type { RefreshTokenDto } from '../use-cases/dto/refreshToken.dto';
import { Roles } from '../decorators/role.decorators';
import { RolesGuard } from '../use-cases/guards/roles.guard';
import { Role } from '@db/generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    return this.authService.logout(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin) // Applying the Roles decorator with Role.admin
  @Get('admin')
  async getAdminData() {
    return { data: 'only for admin' };
  }

  //   could have rate limiting
}
