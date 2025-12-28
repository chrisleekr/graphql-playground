import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(
    @InjectPinoLogger(GqlAuthGuard.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    this.logger.trace(
      { fn: 'getRequest', hasAuth: !!req?.headers?.authorization },
      'Extracting request from GraphQL context',
    );

    return req;
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    if (err || !user) {
      this.logger.debug(
        { fn: 'handleRequest', error: err?.message, info: info?.message },
        'Authentication failed',
      );
      throw err || new Error('Unauthorized');
    }

    this.logger.trace({ fn: 'handleRequest' }, 'Authentication successful');
    return user;
  }
}
