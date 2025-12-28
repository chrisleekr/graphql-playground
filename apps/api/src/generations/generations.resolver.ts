import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GenerationStatus } from '@repo/database';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from '../auth/models/user.model';
import { CreateGenerationInput } from './dto/create-generation.input';
import { PaginationArgs } from './dto/pagination.input';
import { GenerationsService } from './generations.service';
import { Generation } from './models/generation.model';
import { GenerationsConnection } from './models/generations-connection.model';

@Resolver(() => Generation)
@UseGuards(GqlAuthGuard)
export class GenerationsResolver {
  constructor(
    private generationsService: GenerationsService,
    @InjectPinoLogger(GenerationsResolver.name)
    private readonly logger: PinoLogger,
  ) {}

  @Query(() => GenerationsConnection, { name: 'generations' })
  async generations(
    @CurrentUser() user: User,
    @Args('status', { type: () => GenerationStatus, nullable: true })
    status?: GenerationStatus,
    @Args() pagination?: PaginationArgs,
  ): Promise<GenerationsConnection> {
    this.logger.debug({ fn: 'generations', userId: user.id, status }, 'Query: generations');
    return this.generationsService.findAll(user.id, status, pagination?.first, pagination?.after);
  }

  @Query(() => Generation, { name: 'generation' })
  async generation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Generation> {
    this.logger.debug({ fn: 'generation', userId: user.id, id }, 'Query: generation');
    return this.generationsService.findOne(id, user.id);
  }

  @Mutation(() => Generation)
  async createGeneration(
    @Args('input') input: CreateGenerationInput,
    @CurrentUser() user: User,
  ): Promise<Generation> {
    this.logger.info({ fn: 'createGeneration', userId: user.id }, 'Mutation: createGeneration');
    return this.generationsService.create(input, user.id);
  }

  @Mutation(() => Generation)
  async retryGeneration(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Generation> {
    this.logger.info({ fn: 'retryGeneration', userId: user.id, id }, 'Mutation: retryGeneration');
    return this.generationsService.retry(id, user.id);
  }
}
