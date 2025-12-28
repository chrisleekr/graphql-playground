import { createLogger, type Logger } from '@repo/shared';

/**
 * Server-side logger for Next.js API routes and server components
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * logger.info('Processing request');
 * logger.error({ err, userId }, 'Failed to process');
 * ```
 */
export const logger: Logger = createLogger('web');

/**
 * Create a child logger with additional context
 *
 * Usage:
 * ```ts
 * const log = createChildLogger({ module: 'auth', requestId: '123' });
 * log.info('User authenticated');
 * ```
 */
export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

/**
 * Create a request-scoped logger with request context
 *
 * Usage in API routes:
 * ```ts
 * export async function POST(request: Request) {
 *   const log = createRequestLogger(request);
 *   log.info('Processing POST request');
 * }
 * ```
 */
export function createRequestLogger(
  request: Request,
  additionalContext?: Record<string, unknown>,
): Logger {
  const url = new URL(request.url);

  return logger.child({
    method: request.method,
    path: url.pathname,
    ...additionalContext,
  });
}

// Re-export types
export type { Logger };
