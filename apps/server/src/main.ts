import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Starts the NestJS application that serves API routes and the built React admin UI.
 * Enables `rawBody: true` so Shopify webhook HMAC validation receives the untouched request body.
 * Listens on `process.env.PORT` or port `3000` when unset.
 * @returns {Promise<void>} Resolves once the HTTP server is listening; the process stays alive.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
