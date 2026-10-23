import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from '../use-cases/services/auth.service';
import { JwtAuthGuard } from '../use-cases/guards/jwt-auth.guard';
import { LoginDto } from '../use-cases/dto/login.dto';
import { Public } from '../decorators/public.decorators';
import type { SignupDto } from '../use-cases/dto/signup.dto';
import type { RefreshTokenDto } from '../use-cases/dto/refresh-token.dto';
import { Roles } from '../decorators/role.decorators';
import { RolesGuard } from '../use-cases/guards/roles.guard';
import { Role } from '@db/generated/prisma/client';
import { ForgotPasswordDto } from '../use-cases/dto/forgot-password.dto';
import { ResetPasswordDto } from '../use-cases/dto/reset-password.dto';
import type { UpdatePasswordDto } from '@auth/use-cases/dto/update-password.dto';

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
  async logout() {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Post('update')
  async update(@Body() updatePassword: UpdatePasswordDto) {
    return this.authService.updatePassword(updatePassword);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
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
