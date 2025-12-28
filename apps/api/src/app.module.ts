import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { getLogLevel, shouldUsePrettyPrint } from '@repo/shared';
import { Request, Response } from 'express';
import depthLimit from 'graphql-depth-limit';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { GenerationsModule } from './generations/generations.module';
import { GraphQLThrottlerGuard } from './guards/graphql-throttler.guard';
import { HealthModule } from './health/health.module';
import { InngestModule } from './inngest/inngest.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Pino Logger
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'api',
        level: getLogLevel(),
        // Convert numeric levels to text labels (info, warn, error, etc.)
        // See: https://github.com/pinojs/pino/blob/main/docs/help.md
        formatters: {
          level: (label) => ({ level: label }),
        },
        // Redact sensitive data
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
          censor: '[REDACTED]',
        },
        // Pretty print in development
        transport: shouldUsePrettyPrint()
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
        // Customize serializers
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        // Auto-log request/response, skip health check and inngest endpoints
        autoLogging: {
          ignore: (req) => req.url === '/' || req.url?.startsWith('/api/inngest') === true,
        },
        // Custom log level based on status code
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      },
    }),
    // Rate limiting rules: 60 requests per minute by default
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: 3, // 3 requests per second
        },
        {
          name: 'medium',
          ttl: 10000, // 10 seconds
          limit: 20, // 20 requests per 10 seconds
        },
        {
          name: 'long',
          ttl: 60000, // 1 minute
          limit: 60, // 60 requests per minute
        },
      ],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true, // Generate schema in memory, no file write
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      // Security: Disable playground and introspection in production
      // Reference: https://www.apollographql.com/docs/apollo-server/api/apollo-server#introspection
      introspection: process.env.NODE_ENV !== 'production',
      // Security: Limit query depth to prevent DoS attacks via deeply nested queries
      // Reference: https://www.npmjs.com/package/graphql-depth-limit
      // Reference: https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
      validationRules: [depthLimit(5)],
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
    PrismaModule,
    AuthModule,
    GenerationsModule,
    InngestModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GraphQLThrottlerGuard, // To apply rate limit to GraphQL requests
    },
  ],
})
export class AppModule {}
