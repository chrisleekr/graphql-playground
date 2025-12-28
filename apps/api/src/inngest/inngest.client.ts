import { Inngest } from 'inngest';

/**
 * Inngest client instance for the API.
 *
 * This is the main client used to:
 * - Define functions that Inngest will orchestrate
 * - Send events to trigger those functions
 *
 * @see https://www.inngest.com/docs/reference/client/create
 */
export const inngest = new Inngest({
  id: 'graphql-playground',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event type definitions for type safety
export type GenerationRequestedEvent = {
  name: 'generation/requested';
  data: {
    generationId: string;
    userId: string;
    prompt: string;
  };
};

export type GenerationEvents = GenerationRequestedEvent;
