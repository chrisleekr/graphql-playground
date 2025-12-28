import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * GraphQL-compatible throttler guard.
 *
 * Extends the base ThrottlerGuard to handle GraphQL context extraction.
 * The base class automatically handles @SkipThrottle() decorator via its
 * internal shouldSkip() method - no manual override needed.
 *
 * IMPORTANT: Do NOT override the constructor - let ThrottlerGuard handle its own DI.
 * @see https://github.com/nestjs/throttler#graphql
 */
@Injectable()
export class GraphQLThrottlerGuard extends ThrottlerGuard {
  @InjectPinoLogger(GraphQLThrottlerGuard.name)
  private readonly logger!: PinoLogger;

  /**
   * Extract request/response from execution context.
   *
   * For GraphQL: extracts from GqlExecutionContext
   * For REST: extracts from HTTP context
   */
  protected getRequestResponse(context: ExecutionContext) {
    const contextType = context.getType<string>();

    // Handle GraphQL context
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req, res: ctx.res };
    }

    // Handle REST context (for non-GraphQL endpoints like Inngest)
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    return { req, res };
  }

  /**
   * Override throwThrottlingException to log rate limit violations.
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: { limit: number; ttl: number; key: string; tracker: string },
  ): Promise<void> {
    const { req } = this.getRequestResponse(context);
    const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';

    this.logger.warn(
      {
        fn: 'throwThrottlingException',
        ip,
        limit: throttlerLimitDetail.limit,
        ttl: throttlerLimitDetail.ttl,
        key: throttlerLimitDetail.key,
      },
      'Rate limit exceeded',
    );

    throw new ThrottlerException();
  }
}
