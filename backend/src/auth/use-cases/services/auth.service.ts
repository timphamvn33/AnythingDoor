import { UserService } from '@src/user/user.service';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignupDto } from 'src/auth/use-cases/dto/signup.dto';
import * as bcrypt from 'bcrypt';
import type { LoginDto } from 'src/auth/use-cases/dto/login.dto';
import type { RefreshTokenDto } from '@auth/use-cases/dto/refresh-token.dto';
import { JWT_CONSTANTS } from 'src/auth/constants/jwt.constants';
import type { UpdatePasswordDto } from '../dto/update-password.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const emailExisted = await this.userService.findByEmail(signupDto.email);
    if (emailExisted) {
      throw new ConflictException('Email is already in use.');
    }

    const handlePassword = await bcrypt.hash(signupDto.password, 10);
    const user = await this.userService.createUser({
      ...signupDto,
      password: handlePassword,
    });
    return this.generateToken(user);
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto) {
    const handlePassword = await bcrypt.hash(updatePasswordDto.password, 10);
    const user = await this.userService.updatePassword({
      ...updatePasswordDto,
      password: handlePassword,
    });
    return this.generateToken(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid email');

    const ispasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!ispasswordValid) throw new UnauthorizedException('Invalid password');

    return this.generateToken(user);
  }

  async logout(user: unknown) {
    console.log('user: ', user);
    return {
      message: 'Logged out (client should delete token)',
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || JWT_CONSTANTS.REFRESH_TOKEN.SECRET,
      });
      const user = await this.userService.findById(payload.sub);
      console.log('hello refresh: ', user);
      if (!user) throw new UnauthorizedException();
      return this.generateToken(user);
    } catch (error) {
      console.log('refresh token error: ', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || JWT_CONSTANTS.ACCESS_TOKEN.SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || JWT_CONSTANTS.ACCESS_TOKEN.EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || JWT_CONSTANTS.REFRESH_TOKEN.SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || JWT_CONSTANTS.REFRESH_TOKEN.EXPIRES_IN,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
