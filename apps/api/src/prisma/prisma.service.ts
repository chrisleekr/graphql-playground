import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { prisma } from '@repo/database';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// Direct export of the prisma instance for use in services
export { prisma };

// Type helper to avoid TS2742 errors
type UserDelegate = typeof prisma.user;
type GenerationDelegate = typeof prisma.generation;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // Delegate directly to the shared prisma instance with explicit types
  readonly user: UserDelegate = prisma.user;
  readonly generation: GenerationDelegate = prisma.generation;

  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {}

  async onModuleInit() {
    this.logger.info({ fn: 'onModuleInit' }, 'Connecting to database');
    const start = Date.now();

    await prisma.$connect();

    this.logger.info(
      { fn: 'onModuleInit', latency: Date.now() - start },
      'Database connection established',
    );
  }

  async onModuleDestroy() {
    this.logger.info({ fn: 'onModuleDestroy' }, 'Disconnecting from database');

    await prisma.$disconnect();

    this.logger.info({ fn: 'onModuleDestroy' }, 'Database connection closed');
  }
}
