import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

// Escapes regex special chars except `*`, which becomes a `.*` wildcard so
// entries like "https://anything-door-*.vercel.app" match Vercel preview URLs.
function originPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

// Always allow these regardless of CORS_ORIGIN, so the deployed frontend and its
// Vercel preview deployments keep working even if the env var isn't updated.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://anything-door.vercel.app',
  'https://anything-door-*.vercel.app',
];

interface CorsOriginCallback {
  (error: Error | null, allow?: boolean): void;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const envOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]));
  const allowedOriginPatterns = allowedOrigins.map(originPatternToRegExp);

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsOriginCallback) => {
      // Allow non-browser requests (no Origin header), e.g. curl/health checks.
      if (!origin) {
        callback(null, true);
        return;
      }
      const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin));
      callback(isAllowed ? null : new Error(`Origin ${origin} not allowed by CORS`), isAllowed);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
