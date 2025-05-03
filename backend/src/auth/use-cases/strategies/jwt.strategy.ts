import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';
import { JWT_CONSTANTS } from 'src/auth/constants/jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        JWT_CONSTANTS.REFRESH_TOKEN.SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('Payload received in validate:', payload);
    const user = await this.userService.findById(
      payload.sub,
    );

    if (!user) {
      throw new UnauthorizedException(
        'User no longer exists',
      );
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
