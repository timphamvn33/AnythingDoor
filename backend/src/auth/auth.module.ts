import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '@src/user/user.module';
import { AuthController } from './controllers/auth.controler';
import { AuthService } from './use-cases/services/auth.service';
import { JwtStrategy } from './use-cases/strategies/jwt.strategy';
import { JwtAuthGuard } from './use-cases/guards/jwt-auth.guard';
import { JWT_CONSTANTS } from './constants/jwt.constants';
import { RolesGuard } from './use-cases/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || JWT_CONSTANTS.ACCESS_TOKEN.SECRET,
        signOptions: {
          expiresIn:
            configService.get<string>('JWT_EXPIRES_IN') || JWT_CONSTANTS.ACCESS_TOKEN.EXPIRES_IN,
        },
      }),
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
