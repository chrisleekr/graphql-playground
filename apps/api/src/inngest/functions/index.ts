/**
 * Export all Inngest function factories.
 *
 * These factory functions are used by InngestService to create
 * functions with injected NestJS dependencies.
 */
export { createProcessGeneration, type ProcessGenerationDeps } from './process-generation.function';
