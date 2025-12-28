/**
 * Server-side runtime configuration.
 *
 * Why: NEXT_PUBLIC_* vars are inlined at build time, making them useless
 * for runtime configuration. Server-only vars (without NEXT_PUBLIC_ prefix)
 * are read at runtime when used in Server Components.
 *
 * @see https://nextjs.org/docs/app/guides/environment-variables
 */

const DEFAULT_GRAPHQL_API_URL = 'http://localhost:3001/graphql';

export function getGraphQLApiUrl(): string {
  return process.env.GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL;
}

