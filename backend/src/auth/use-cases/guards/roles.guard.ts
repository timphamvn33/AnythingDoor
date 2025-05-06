import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@db/generated/prisma/client'; // Import Role enum
import { ROLES_KEY } from '@src/auth/decorators/role.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('requiredRoles: ', requiredRoles);
    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('hello 1');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      console.log('hello 2');
      throw new ForbiddenException('Forbidden resource: not find the user or roles');
    }

    const hasRole = requiredRoles.some(role => user.role?.includes(role));

    if (!hasRole) {
      console.log('hello 3');
      throw new ForbiddenException('Forbidden resource: User Roles are not allowed to execute');
    }
    console.log('hello 4');
    return true;
  }
}
