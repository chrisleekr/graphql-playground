import pino, { type Logger, type LoggerOptions } from 'pino';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Get the current log level from environment or default
 */
export function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  return envLevel || DEFAULT_LOG_LEVEL;
}

/**
 * Check if we should use pretty printing (development only)
 */
export function shouldUsePrettyPrint(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Base Pino configuration options shared across all apps
 */
function getBaseLoggerOptions(name?: string): LoggerOptions {
  const level = getLogLevel();

  const baseOptions: LoggerOptions = {
    level,
    ...(name && { name }),
    // Redact sensitive fields from logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'token',
        'accessToken',
      ],
      censor: '[REDACTED]',
    },
    // Custom timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,
    // Standardize log format
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  // Add pretty printing for development
  if (shouldUsePrettyPrint()) {
    return {
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return baseOptions;
}

/**
 * Create a Pino logger instance with base configuration
 */
export function createLogger(name?: string): Logger {
  return pino(getBaseLoggerOptions(name));
}

/**
 * Re-export Logger type for consumers
 */
export type { Logger };
