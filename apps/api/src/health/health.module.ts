import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health Module.
 *
 * Provides health check endpoint at `/` that verifies:
 * - Database (PostgreSQL via Prisma) connectivity
 * - Redis connectivity
 *
 * Used by load balancers and monitoring systems to determine
 * if the API instance is ready to receive traffic.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}

