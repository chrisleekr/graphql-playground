import { Injectable, OnModuleInit } from '@nestjs/common';
import { serve } from 'inngest/express';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { inngest } from './inngest.client';
import { createProcessGeneration } from './functions/process-generation.function';

/**
 * Inngest Service for NestJS.
 *
 * This service manages the Inngest serve handler with proper dependency injection.
 * It initializes the handler after the module is loaded, ensuring all dependencies are available.
 *
 * @see https://www.inngest.com/docs/reference/serve
 */
@Injectable()
export class InngestService implements OnModuleInit {
  private handler!: ReturnType<typeof serve>;

  /**
   * Constructor for InngestService.
   *
   * @param prisma - PrismaService instance
   * @param logger - PinoLogger instance
   */
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(InngestService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Initialize the Inngest serve handler after module initialization.
   * This ensures all dependencies are properly injected before creating functions.
   */
  onModuleInit() {
    this.logger.info({ fn: 'onModuleInit' }, 'Initializing Inngest service with dependencies');

    // Create Inngest functions with injected dependencies
    const processGeneration = createProcessGeneration({
      prisma: this.prisma,
      logger: this.logger,
    });

    // Create the serve handler
    // Refer: https://www.inngest.com/docs/reference/serve#serve-client-functions-options
    this.handler = serve({
      // An Inngest client
      client: inngest,
      // The domain host of your application, including protocol, e.g. https://myapp.com.
      // For local dev with Docker: use host.docker.internal so Inngest container can reach host.
      // In production: set INNGEST_SERVE_HOST to your actual domain.
      serveHost:
        process.env.INNGEST_SERVE_HOST ||
        (process.env.NODE_ENV === 'production' ? undefined : 'http://host.docker.internal:3001'),
      // The path where your serve handler is hosted. The SDK attempts to infer this via HTTP headers at runtime. We recommend /api/inngest. See also INNGEST_SERVE_PATH.
      servePath: '/api/inngest',
      // An array of Inngest functions defined using inngest.createFunction().
      functions: [processGeneration],
      // The Inngest Signing Key for your selected environment. We recommend setting the INNGEST_SIGNING_KEY environment variable instead of passing the signingKey option. You can find this in the Inngest dashboard.
      signingKey: process.env.INNGEST_SIGNING_KEY,
      logLevel: 'debug',
    });

    this.logger.info(
      { fn: 'onModuleInit', serveHost: process.env.INNGEST_SERVE_HOST, servePath: '/api/inngest' },
      'Inngest service initialized successfully',
    );
  }

  /**
   * Handle incoming Inngest requests.
   * Delegates to the serve handler created during module initialization.
   */
  handleRequest(req: Request, res: Response) {
    this.logger.trace(
      { fn: 'handleRequest', method: req.method, url: req.url },
      'Handling Inngest request',
    );
    return this.handler(req, res);
  }
}
