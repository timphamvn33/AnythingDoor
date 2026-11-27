import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Prisma } from '@db/generated/prisma';
import { map, Observable } from 'rxjs';

export function serializeDecimals(value: unknown): unknown {
  if (Prisma.Decimal.isDecimal(value)) {
    return value.toNumber();
  }
  if (Array.isArray(value)) {
    return value.map(serializeDecimals);
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeDecimals(item)]),
    );
  }
  return value;
}

@Injectable()
export class DecimalResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(serializeDecimals));
  }
}
