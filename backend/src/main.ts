import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

// Escapes regex special chars except `*`, which becomes a `.*` wildcard so
// entries like "https://anything-door-*.vercel.app" match Vercel preview URLs.
function originPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (
    process.env.CORS_ORIGIN || 'http://localhost:5173,https://anything-door.vercel.app'
  )
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  const allowedOriginPatterns = allowedOrigins.map(originPatternToRegExp);

  app.enableCors({
    origin: (origin, callback) => {
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
