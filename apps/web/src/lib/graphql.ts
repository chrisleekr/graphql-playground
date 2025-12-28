/**
 * GraphQL client utilities.
 *
 * Why apiUrl is a parameter: The URL must be passed from Server Components
 * (where env vars are read at runtime) to Client Components (where they cannot).
 */

const DEFAULT_GRAPHQL_API_URL = 'http://localhost:3001/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  accessToken?: string,
  apiUrl?: string,
): Promise<T> {
  const url = apiUrl || DEFAULT_GRAPHQL_API_URL;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    console.error('GraphQL non-JSON response:', text);
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    console.error('GraphQL errors:', result.errors);
    throw new Error(result.errors[0].message);
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL');
  }

  return result.data;
}

export const GENERATIONS_QUERY = `
  query Generations {
    generations {
      edges {
        node {
          id
          status
          prompt
          result
          error
          createdAt
          startedAt
          completedAt
        }
      }
    }
  }
`;

export const CREATE_GENERATION_MUTATION = `
  mutation CreateGeneration($input: CreateGenerationInput!) {
    createGeneration(input: $input) {
      id
      status
      prompt
      createdAt
    }
  }
`;

export const RETRY_GENERATION_MUTATION = `
  mutation RetryGeneration($id: ID!) {
    retryGeneration(id: $id) {
      id
      status
    }
  }
`;
