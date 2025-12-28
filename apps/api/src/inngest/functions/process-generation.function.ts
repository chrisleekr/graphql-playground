import { getRedisClient } from '@repo/redis';
import type { PinoLogger } from 'nestjs-pino';
import type { PrismaService } from '../../prisma/prisma.service';
import { inngest } from '../inngest.client';

/**
 * Dependencies required by the process generation function.
 */
export interface ProcessGenerationDeps {
  prisma: PrismaService;
  logger: PinoLogger;
}

/**
 * Generation processing stages for realistic AI inference simulation.
 * Each stage updates Redis for real-time progress tracking.
 */
const STAGES = {
  INITIALIZING: { progress: 0, stage: 'initializing' },
  LOADING_MODEL: { progress: 10, stage: 'loading_model' },
  PROCESSING_PROMPT: { progress: 25, stage: 'processing_prompt' },
  GENERATING: { progress: 40, stage: 'generating' },
  POST_PROCESSING: { progress: 85, stage: 'post_processing' },
  COMPLETE: { progress: 100, stage: 'complete' },
} as const;

/**
 * Update generation progress in Redis for real-time status tracking.
 */
async function updateProgress(
  generationId: string,
  status: string,
  progress: number,
  stage: string,
  extra: Record<string, string> = {},
) {
  const redis = getRedisClient();
  await redis.hset(`generation:${generationId}:progress`, {
    status,
    progress: progress.toString(),
    stage,
    updatedAt: new Date().toISOString(),
    ...extra,
  });
  // Set TTL of 1 hour for progress data
  await redis.expire(`generation:${generationId}:progress`, 3600);
}

/**
 * Factory function to create the process generation Inngest function.
 *
 * This function simulates AI image generation with realistic stages:
 * 1. Initializing - Queue the job, update status
 * 2. Loading model - Simulate model loading time
 * 3. Processing prompt - Parse and enhance the prompt
 * 4. Generating - Main generation phase (variable time)
 * 5. Post-processing - Upscaling, refinement
 * 6. Complete - Store result
 *
 * Each step is durable and will be retried on failure.
 *
 * Logging strategy:
 * - NestJS PinoLogger: Primary structured logs for application observability
 * - Inngest logger: Minimal logs for Inngest dashboard visibility only
 *
 * @param deps - Dependencies injected from NestJS DI container
 * @returns Inngest function configured with dependencies
 *
 * @see https://www.inngest.com/docs/functions
 */
export function createProcessGeneration(deps: ProcessGenerationDeps) {
  const { prisma, logger: log } = deps;
  const fn = 'processGeneration';

  return inngest.createFunction(
    {
      id: 'process-generation',
      // Retry configuration
      retries: 3,
      // Concurrency control - limit concurrent jobs per user
      concurrency: [
        { limit: 5 }, // Global limit for free plan
        { limit: 2, key: 'event.data.userId' }, // Per-user limit
      ],
    },
    { event: 'generation/requested' },
    async ({ event, step }) => {
      const { generationId, userId, prompt } = event.data;

      log.info({ fn, generationId, userId, prompt }, 'Starting generation processing');

      // Step 1: Mark as processing and initialize
      await step.run('start-processing', async () => {
        log.debug({ fn, step: 'start-processing', generationId }, 'Initializing generation');

        await updateProgress(
          generationId,
          'PROCESSING',
          STAGES.INITIALIZING.progress,
          STAGES.INITIALIZING.stage,
        );

        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'PROCESSING',
            startedAt: new Date(),
          },
        });
      });

      // Step 2: Simulate model loading
      await step.run('load-model', async () => {
        log.debug({ fn, step: 'load-model', generationId }, 'Loading model');

        await updateProgress(
          generationId,
          'PROCESSING',
          STAGES.LOADING_MODEL.progress,
          STAGES.LOADING_MODEL.stage,
        );
      });
      await step.sleep('model-load-delay', '1s');

      // Step 3: Process prompt
      await step.run('process-prompt', async () => {
        log.debug({ fn, step: 'process-prompt', generationId }, 'Processing prompt');

        await updateProgress(
          generationId,
          'PROCESSING',
          STAGES.PROCESSING_PROMPT.progress,
          STAGES.PROCESSING_PROMPT.stage,
        );
      });
      await step.sleep('prompt-delay', '500ms');

      // Step 4: Check for forced failure (for testing)
      const generation = await step.run('check-force-fail', async () => {
        log.trace({ fn, step: 'check-force-fail', generationId }, 'Checking for forced failure');
        return prisma.generation.findUnique({
          where: { id: generationId },
          select: { forceFail: true },
        });
      });

      if (generation?.forceFail) {
        await step.run('handle-failure', async () => {
          log.warn({ fn, step: 'handle-failure', generationId }, 'Forced failure triggered');

          await updateProgress(generationId, 'FAILED', 0, 'failed', {
            error: 'Forced failure (testing)',
          });

          await prisma.generation.update({
            where: { id: generationId },
            data: {
              status: 'FAILED',
              error: 'Forced failure (testing)',
              completedAt: new Date(),
            },
          });
        });

        log.info({ fn, generationId, success: false }, 'Generation failed (forced)');
        return { success: false, error: 'Forced failure' };
      }

      // Step 5: Main generation phase (variable time like real AI)
      await step.run('start-generation', async () => {
        log.debug({ fn, step: 'start-generation', generationId }, 'Starting generation phase');

        await updateProgress(
          generationId,
          'PROCESSING',
          STAGES.GENERATING.progress,
          STAGES.GENERATING.stage,
        );
      });

      // Simulate variable generation time (1-3 seconds like real AI inference)
      const generationTimeMs = Math.floor(Math.random() * 2000) + 1000;
      await step.sleep('generation-delay', `${generationTimeMs}ms`);

      // Step 6: Post-processing
      await step.run('post-process', async () => {
        log.debug({ fn, step: 'post-process', generationId }, 'Post-processing generation');

        await updateProgress(
          generationId,
          'PROCESSING',
          STAGES.POST_PROCESSING.progress,
          STAGES.POST_PROCESSING.stage,
        );
      });
      await step.sleep('post-process-delay', '1s');

      // Step 7: Complete and store result
      const result = await step.run('complete-generation', async () => {
        log.debug({ fn, step: 'complete-generation', generationId }, 'Completing generation');

        // TODO: Generate temporary placeholder image (in production, this would be the AI-generated image)
        const imageUrl = `https://picsum.photos/seed/${generationId}/512/512`;

        await updateProgress(
          generationId,
          'COMPLETE',
          STAGES.COMPLETE.progress,
          STAGES.COMPLETE.stage,
          {
            result: imageUrl,
          },
        );

        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'COMPLETE',
            result: imageUrl,
            completedAt: new Date(),
          },
        });

        return { imageUrl };
      });

      log.info({ fn, generationId, result, success: true }, 'Generation completed successfully');

      return { success: true, ...result };
    },
  );
}
