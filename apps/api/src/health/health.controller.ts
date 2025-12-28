import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service';

/**
 * Health Check Controller.
 *
 * Exposes the root `/` endpoint for health checks.
 * Used by load balancers, orchestrators, and monitoring systems
 * to verify the API and its dependencies are operational.
 *
 * Rate limiting is skipped for health check endpoints to ensure
 * monitoring systems can always access the health status.
 */
@SkipThrottle({ short: true, medium: true, long: true })
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Health check endpoint.
   *
   * @returns Health status with database and Redis connectivity
   * @status 200 - All services are healthy
   * @status 503 - One or more services are unhealthy
   */
  @Get()
  async check(@Res() res: Response) {
    const health = await this.healthService.check();

    // Return 503 Service Unavailable if unhealthy
    const statusCode =
      health.status === 'healthy' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json(health);
  }
}

