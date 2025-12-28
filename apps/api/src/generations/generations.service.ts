import { Injectable, NotFoundException } from '@nestjs/common';
import { GenerationStatus, Prisma } from '@repo/database';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { inngest } from '../inngest/inngest.client';
import { CreateGenerationInput } from './dto/create-generation.input';

@Injectable()
export class GenerationsService {
  constructor(
    private prisma: PrismaService,
    @InjectPinoLogger(GenerationsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async findAll(userId: string, status?: GenerationStatus, first: number = 20, after?: string) {
    this.logger.debug({ fn: 'findAll', userId, status, first, after }, 'Fetching generations');

    const where: Prisma.GenerationWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    // Decode cursor (base64 encoded id)
    const cursor = after ? { id: Buffer.from(after, 'base64').toString('utf-8') } : undefined;

    // Fetch one extra to determine if there are more pages
    const items = await this.prisma.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: first + 1,
      ...(cursor && { skip: 1, cursor }),
    });

    // Get total count for the query
    const totalCount = await this.prisma.generation.count({ where });

    const hasNextPage = items.length > first;
    const edges = items.slice(0, first).map((item) => ({
      node: item,
      cursor: Buffer.from(item.id).toString('base64'),
    }));

    this.logger.debug(
      { fn: 'findAll', userId, count: edges.length, totalCount, hasNextPage },
      'Generations fetched successfully',
    );

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
      totalCount,
    };
  }

  async findOne(id: string, userId: string) {
    this.logger.debug({ fn: 'findOne', id, userId }, 'Finding generation');

    const generation = await this.prisma.generation.findFirst({
      where: { id, userId },
    });

    if (!generation) {
      this.logger.warn({ fn: 'findOne', id, userId }, 'Generation not found');
      throw new NotFoundException('Generation not found');
    }

    this.logger.debug({ fn: 'findOne', id, status: generation.status }, 'Generation found');
    return generation;
  }

  async create(input: CreateGenerationInput, userId: string) {
    this.logger.info({ fn: 'create', userId, prompt: input.prompt }, 'Creating generation');

    const generation = await this.prisma.generation.create({
      data: {
        userId,
        prompt: input.prompt.trim(),
        status: 'PENDING',
        forceFail: Boolean(input.forceFail),
      },
    });

    this.logger.debug({ fn: 'create', generationId: generation.id }, 'Generation record created');

    // Publish to Inngest queue
    try {
      await inngest.send({
        name: 'generation/requested',
        data: {
          generationId: generation.id,
          userId,
          prompt: generation.prompt,
        },
      });

      this.logger.info({ fn: 'create', generationId: generation.id }, 'Generation queued to Inngest');
    } catch (error) {
      this.logger.error({ fn: 'create', err: error, generationId: generation.id }, 'Failed to queue generation');

      await this.prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED', error: 'Failed to queue generation' },
      });
      throw error;
    }

    return generation;
  }

  async retry(id: string, userId: string) {
    this.logger.info({ fn: 'retry', id, userId }, 'Retrying failed generation');

    const generation = await this.prisma.generation.findFirst({
      where: { id, userId, status: 'FAILED' },
    });

    if (!generation) {
      this.logger.warn({ fn: 'retry', id, userId }, 'Generation not found or cannot be retried');
      throw new NotFoundException('Generation not found or cannot be retried');
    }

    const updatedGeneration = await this.prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: 'PENDING',
        error: null,
        startedAt: null,
        completedAt: null,
      },
    });

    this.logger.debug({ fn: 'retry', generationId: generation.id }, 'Generation status reset to PENDING');

    // Republish to Inngest queue
    await inngest.send({
      name: 'generation/requested',
      data: {
        generationId: generation.id,
        userId,
        prompt: generation.prompt,
      },
    });

    this.logger.info({ fn: 'retry', generationId: generation.id }, 'Generation re-queued to Inngest');

    return updatedGeneration;
  }
}
