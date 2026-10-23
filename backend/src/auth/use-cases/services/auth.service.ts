import { UserService } from '@src/user/user.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignupDto } from '@src/auth/use-cases/dto/signup.dto';
import * as bcrypt from 'bcrypt';
import type { LoginDto } from '@src/auth/use-cases/dto/login.dto';
import type { RefreshTokenDto } from '@auth/use-cases/dto/refresh-token.dto';
import { JWT_CONSTANTS } from '@src/auth/constants/jwt.constants';
import type { UpdatePasswordDto } from '../dto/update-password.dto';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import { validatePasswordStrength } from '../dto/reset-password.dto';
import { PrismaService } from '@src/prisma/prisma.service';
import { MailService } from './mail.service';
import { createHash, randomBytes } from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Always resolves the same way so callers can't discover which emails are registered.
  async forgotPassword({ email }: ForgotPasswordDto) {
    if (typeof email !== 'string' || !email) {
      throw new BadRequestException('Email is required.');
    }
    const user = await this.userService.findByEmail(email);
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        this.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        }),
      ]);

      const frontendUrl = (
        process.env.FRONTEND_URL ||
        (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0]
      )
        .trim()
        .replace(/\/$/, '');
      try {
        await this.mailService.sendPasswordResetEmail(
          user.email,
          `${frontendUrl}/reset-password?token=${token}`,
        );
      } catch (error) {
        this.logger.error('Failed to send password reset email', error);
      }
    }
    return { message: 'If an account exists for that email, a reset link has been sent.' };
  }

  async resetPassword({ token, password }: ResetPasswordDto) {
    if (typeof token !== 'string' || !token) {
      throw new BadRequestException('Reset link is invalid or has expired.');
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      throw new BadRequestException(passwordError);
    }
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired.');
    }

    const handlePassword = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { password: handlePassword } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
    return { message: 'Password has been reset. You can now sign in.' };
  }

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
    if (!updatePasswordDto.password) {
      throw new BadRequestException('Password is required.');
    }
    const handlePassword = await bcrypt.hash(updatePasswordDto.password, 10);
    const user = await this.userService.updatePassword({
      ...updatePasswordDto,
      password: handlePassword || undefined,
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

  async logout() {
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
      if (!user) throw new UnauthorizedException();
      return this.generateToken(user);
    } catch {
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
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        zip: user.zip,
        currentLocation: user.currentLocation,
      },
    };
  }
}
