import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthController } from './controllers/auth.controler';
import { AuthService } from './use-cases/services/auth.service';
import { JwtStrategy } from './use-cases/strategies/jwt.strategy';
import { JwtAuthGuard } from './use-cases/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }), // to access environment variables
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_ACCESS_SECRET',
        ),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
