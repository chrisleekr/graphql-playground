import Redis from 'ioredis';

// Global singleton for the Redis client
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/**
 * Get or create a singleton Redis client.
 *
 * Uses REDIS_URL environment variable which should be a connection string:
 * - Upstash: rediss://default:<password>@<host>.upstash.io:6379
 * - Local: redis://localhost:6379
 *
 * @throws Error if REDIS_URL is not set
 */
export function getRedisClient(): Redis {
  if (!globalForRedis.redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    globalForRedis.redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 100, 2000); // Exponential backoff, max 2s
      },
      // Enable keepalive for long-lived connections
      keepAlive: 10000,
      // Lazy connect - don't connect until first command
      lazyConnect: true,
    });

    // Handle connection errors gracefully
    globalForRedis.redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    globalForRedis.redis.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Redis] Connected');
      }
    });
  }

  return globalForRedis.redis;
}

/**
 * Convenience alias for getRedisClient()
 */
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const client = getRedisClient();
    const value = client[prop as keyof Redis];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Gracefully close the Redis connection.
 * Call this during application shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (globalForRedis.redis) {
    await globalForRedis.redis.quit();
    globalForRedis.redis = undefined;
  }
}

// Re-export Redis type for consumers
export { Redis };
export type { RedisOptions } from 'ioredis';
