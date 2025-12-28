import { getRedisClient } from '@repo/redis';

export type RateLimitConfig = {
  /** Unique identifier for this limiter (e.g., 'auth', 'generations') */
  name: string;
  /** Maximum number of requests allowed in the window */
  requests: number;
  /** Time window in seconds */
  windowSeconds: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Parse window string like '1 m', '60 s', '1 h' into seconds
 */
function parseWindow(window: `${number} ${'s' | 'm' | 'h' | 'd'}`): number {
  const [value, unit] = window.split(' ') as [string, 's' | 'm' | 'h' | 'd'];
  const num = parseInt(value, 10);
  switch (unit) {
    case 's':
      return num;
    case 'm':
      return num * 60;
    case 'h':
      return num * 3600;
    case 'd':
      return num * 86400;
    default:
      return num;
  }
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 *
 * This implementation uses a sorted set where:
 * - Each request is stored with its timestamp as the score
 * - Old requests outside the window are removed
 * - The count of remaining requests determines if the limit is exceeded
 *
 * @param identifier - Unique identifier for the requester (e.g., IP, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(userId, RATE_LIMITS.GENERATION_CREATE);
 * if (!result.success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  config:
    | RateLimitConfig
    | { name: string; requests: number; window: `${number} ${'s' | 'm' | 'h' | 'd'}` },
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  // Handle both old window format and new windowSeconds format
  const windowSeconds =
    'windowSeconds' in config
      ? config.windowSeconds
      : parseWindow(config.window as `${number} ${'s' | 'm' | 'h' | 'd'}`);

  const key = `ratelimit:${config.name}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Use a pipeline for atomic operations
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Count current entries in the window
  pipeline.zcard(key);

  // Add the current request with timestamp as score
  // Using a unique member (timestamp + random) to allow multiple requests at same ms
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
  pipeline.zadd(key, now, member);

  // Set TTL on the key to auto-cleanup
  pipeline.expire(key, windowSeconds + 1);

  const results = await pipeline.exec();

  if (!results) {
    // Pipeline failed, allow the request but log warning
    console.warn('[RateLimit] Pipeline execution failed');
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: now + windowSeconds * 1000,
    };
  }

  // results[1] is the ZCARD result (count before adding current request)
  const [, zcardResult] = results;
  const currentCount = (zcardResult?.[1] as number) || 0;

  const success = currentCount < config.requests;
  const remaining = Math.max(0, config.requests - currentCount - 1);
  const reset = now + windowSeconds * 1000;

  // If over limit, remove the request we just added
  if (!success) {
    await redis.zrem(key, member);
  }

  return {
    success,
    limit: config.requests,
    remaining,
    reset,
  };
}

// Pre-defined rate limit configs for common use cases
export const RATE_LIMITS = {
  /** Registration: 5 requests per minute */
  REGISTER: { name: 'register', requests: 5, windowSeconds: 60 } as const,
  /** Login: 10 requests per minute */
  LOGIN: { name: 'login', requests: 10, windowSeconds: 60 } as const,
  /** Create generation: 20 requests per minute */
  GENERATION_CREATE: { name: 'gen-create', requests: 20, windowSeconds: 60 } as const,
  /** Read generations: 60 requests per minute */
  GENERATION_READ: { name: 'gen-read', requests: 60, windowSeconds: 60 } as const,
} satisfies Record<string, RateLimitConfig>;
