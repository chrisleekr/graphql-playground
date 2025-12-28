import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino logger for all NestJS logging
  app.useLogger(app.get(Logger));

  // Security headers via Helmet
  // Reference: https://helmetjs.github.io/
  // Reference: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"], // Deny everything by default
              scriptSrc: ["'none'"], // No scripts (API only serves JSON)
              styleSrc: ["'none'"], // No styles
              imgSrc: ["'none'"], // No images
              connectSrc: ["'self'"], // Only allow connections to self
              fontSrc: ["'none'"], // No fonts
              objectSrc: ["'none'"], // No plugins
              mediaSrc: ["'none'"], // No media
              frameSrc: ["'none'"], // No iframes
              frameAncestors: ["'none'"], // Prevent embedding
              formAction: ["'none'"], // No form submissions
              baseUri: ["'none'"], // No base tag
              upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
            },
          }
        : false, // Disable CSP in development for GraphQL Playground
      crossOriginEmbedderPolicy: isProduction,
      crossOriginOpenerPolicy: isProduction ? { policy: 'same-origin' } : false,
      crossOriginResourcePolicy: isProduction ? { policy: 'same-origin' } : false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // Note: forbidNonWhitelisted can cause issues with GraphQL
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 API running on http://localhost:${port}/graphql`);
}

bootstrap();
