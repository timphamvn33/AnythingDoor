import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(
        'isPublic',
        [context.getHandler(), context.getClass()],
      );
    console.log('check jwt token...');
    if (isPublic) return true;
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any) {
    if (err || !user) {
      console.log('error in handler request');
      throw new UnauthorizedException(
        'Invalid or missing JWT token',
      );
    }
    return user;
  }
}
