import { Module } from '@nestjs/common';
import { InngestController } from './inngest.controller';
import { InngestService } from './inngest.service';

/**
 * Inngest Module.
 *
 * Provides the Inngest serve endpoint for the API.
 * This module registers the /api/inngest route that Inngest uses to discover and execute functions.
 *
 * The module uses NestJS dependency injection to provide services (Prisma, Logger) to Inngest functions, following the factory pattern for function creation.
 *
 * @see https://www.inngest.com/docs/reference/serve
 */
@Module({
  controllers: [InngestController],
  providers: [InngestService],
  exports: [InngestService],
})
export class InngestModule {}
