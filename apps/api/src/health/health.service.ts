import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { getRedisClient } from '@repo/redis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectPinoLogger(HealthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async check(): Promise<HealthStatus> {
    this.logger.debug({ fn: 'check' }, 'Starting health check');

    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const isHealthy = database.status === 'up' && redis.status === 'up';

    this.logger.info(
      { fn: 'check', database: database.status, redis: redis.status, isHealthy },
      'Health check completed',
    );

    if (isHealthy) {
      try {
        // Fire-and-forget: update database health check timestamp
        void Promise.all([
          this.updateLastDatabaseHealthCheckAt(),
          this.updateLastRedisHealthCheckAt(),
        ]);
      } catch (error) {
        this.logger.error({ fn: 'check', err: error }, 'Failed to update health check timestamps');
      }
    }

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
    };
  }

  /**
   * Update the last_healthcheck_at setting in the database.
   * This is used as a workaround for keeping the database in use.
   * @returns void
   */
  private async updateLastDatabaseHealthCheckAt(): Promise<void> {
    const now = new Date().toISOString();
    try {
      await prisma.setting.upsert({
        where: { key: 'last_healthcheck_at' },
        update: { value: now },
        create: { key: 'last_healthcheck_at', value: now },
      });
      this.logger.debug(
        { fn: 'updateLastDatabaseHealthCheckAt', timestamp: now },
        'Updated last_healthcheck_at',
      );
    } catch (error) {
      this.logger.warn(
        { fn: 'updateLastDatabaseHealthCheckAt', err: error },
        'Failed to update last_healthcheck_at setting',
      );
    }
  }

  /**
   * Update the last_redis_healthcheck_at key in Redis.
   * This is used as a workaround for keeping the Redis instance in use.
   * @returns void
   */
  private async updateLastRedisHealthCheckAt(): Promise<void> {
    const now = new Date().toISOString();
    try {
      const redis = getRedisClient();
      await redis.set('last_redis_healthcheck_at', now);
      this.logger.debug(
        { fn: 'updateLastRedisHealthCheckAt', timestamp: now },
        'Updated last_redis_healthcheck_at',
      );
    } catch (error) {
      this.logger.warn(
        { fn: 'updateLastRedisHealthCheckAt', err: error },
        'Failed to update last_redis_healthcheck_at setting',
      );
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      this.logger.trace({ fn: 'checkDatabase', latency }, 'Database check passed');
      return {
        status: 'up',
        latency,
      };
    } catch (error) {
      this.logger.error({ fn: 'checkDatabase', err: error }, 'Database check failed');
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const redis = getRedisClient();
      const pong = await redis.ping();

      if (pong === 'PONG') {
        const latency = Date.now() - start;
        this.logger.trace({ fn: 'checkRedis', latency }, 'Redis check passed');

        return {
          status: 'up',
          latency,
        };
      }

      this.logger.warn({ fn: 'checkRedis', pong }, 'Redis ping did not return PONG');
      return {
        status: 'down',
        error: 'Ping did not return PONG',
      };
    } catch (error) {
      this.logger.error({ fn: 'checkRedis', err: error }, 'Redis check failed');
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
