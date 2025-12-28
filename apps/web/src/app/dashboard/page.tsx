import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import type { GenerationResult } from '@repo/shared';
import { authOptions } from '@/lib/auth';
import { getGraphQLApiUrl } from '@/lib/config';
import { graphqlRequest, GENERATIONS_QUERY } from '@/lib/graphql';
import { Dashboard } from './Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | AI Image Generator',
  description: 'Create and manage your AI-generated images. View generation status, retry failed jobs, and track processing time.',
};

interface GenerationNode {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
  prompt: string;
  result: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface GenerationsQueryResponse {
  generations: {
    edges: Array<{ node: GenerationNode }>;
  };
}

async function getInitialGenerations(
  accessToken: string,
  graphqlApiUrl: string,
): Promise<GenerationResult[]> {
  try {
    const data = await graphqlRequest<GenerationsQueryResponse>(
      GENERATIONS_QUERY,
      {},
      accessToken,
      graphqlApiUrl,
    );
    return data.generations.edges.map((edge) => ({
      id: edge.node.id,
      status: edge.node.status,
      prompt: edge.node.prompt,
      result: edge.node.result,
      error: edge.node.error,
      createdAt: edge.node.createdAt,
      startedAt: edge.node.startedAt,
      completedAt: edge.node.completedAt,
    }));
  } catch (error) {
    console.error('Failed to fetch initial generations:', error);
    return [];
  }
}

export default async function DashboardPage() {
  // Why connection(): Ensures env vars are read at runtime, not build time.
  // Without this, process.env might return build-time values.
  await connection();

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const graphqlApiUrl = getGraphQLApiUrl();
  const initialGenerations = await getInitialGenerations(session.accessToken, graphqlApiUrl);

  return (
    <Dashboard
      user={session.user}
      initialGenerations={initialGenerations}
      graphqlApiUrl={graphqlApiUrl}
    />
  );
}
