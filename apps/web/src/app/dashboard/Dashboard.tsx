'use client';

import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GenerationResult } from '@repo/shared';
import {
  graphqlRequest,
  GENERATIONS_QUERY,
  CREATE_GENERATION_MUTATION,
  RETRY_GENERATION_MUTATION,
} from '@/lib/graphql';
import styles from './dashboard.module.css';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface DashboardProps {
  user: User;
  initialGenerations?: GenerationResult[];
  graphqlApiUrl: string;
}

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

interface CreateGenerationResponse {
  createGeneration: {
    id: string;
    status: string;
    prompt: string;
    createdAt: string;
  };
}

interface RetryGenerationResponse {
  retryGeneration: {
    id: string;
    status: string;
  };
}

// Minimum time between fetches to avoid rate limiting (3 req/sec API limit)
const POLL_INTERVAL_MS = 2000;
const MIN_FETCH_INTERVAL_MS = 500;

export function Dashboard({ user, initialGenerations = [], graphqlApiUrl }: DashboardProps) {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState('');
  const [generations, setGenerations] = useState<GenerationResult[]>(initialGenerations);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [forceFail, setForceFail] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchGenerations = useCallback(async (force = false) => {
    if (!session?.accessToken) return;

    // Prevent fetching too frequently (unless forced)
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL_MS) {
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      const data = await graphqlRequest<GenerationsQueryResponse>(
        GENERATIONS_QUERY,
        {},
        session.accessToken,
        graphqlApiUrl,
      );
      const results: GenerationResult[] = data.generations.edges.map((edge) => ({
        id: edge.node.id,
        status: edge.node.status,
        prompt: edge.node.prompt,
        result: edge.node.result,
        error: edge.node.error,
        createdAt: edge.node.createdAt,
        startedAt: edge.node.startedAt,
        completedAt: edge.node.completedAt,
      }));
      setGenerations(results);
    } catch (err) {
      console.error('Failed to fetch generations:', err);
    }
  }, [session?.accessToken, graphqlApiUrl]);

  // Check if there are any active (pending/processing) generations
  const hasActiveGenerations = generations.some(
    (gen) => gen.status === 'PENDING' || gen.status === 'PROCESSING'
  );

  // Mark component as mounted for hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Only fetch on mount if we don't have initial data, or if there are active generations
  useEffect(() => {
    if (!hasMounted) return;

    // If we have initial data and no active generations, skip initial fetch
    if (initialGenerations.length > 0 && !hasActiveGenerations) return;

    fetchGenerations();
  }, [hasMounted, fetchGenerations, initialGenerations.length, hasActiveGenerations]);

  // Poll when there are active generations
  useEffect(() => {
    if (!hasMounted || !hasActiveGenerations) return;

    const interval = setInterval(fetchGenerations, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasMounted, hasActiveGenerations, fetchGenerations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting || !session?.accessToken) return;

    setError('');
    setIsSubmitting(true);

    try {
      await graphqlRequest<CreateGenerationResponse>(
        CREATE_GENERATION_MUTATION,
        { input: { prompt, forceFail } },
        session.accessToken,
        graphqlApiUrl,
      );

      setPrompt('');
      setForceFail(false); // Reset checkbox after submit
      fetchGenerations(true); // Force fetch after mutation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create generation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async (generationId: string) => {
    if (!session?.accessToken) return;

    try {
      await graphqlRequest<RetryGenerationResponse>(
        RETRY_GENERATION_MUTATION,
        { id: generationId },
        session.accessToken,
        graphqlApiUrl,
      );
      fetchGenerations(true); // Force fetch after mutation
    } catch (err) {
      console.error('Failed to retry generation:', err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>AI Generator</span>
        </div>
        <div className={styles.userInfo}>
          <span>{user.email}</span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.generator}>
          <h2>Let's Create</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type a prompt here..."
              disabled={isSubmitting}
            />
            <button type="submit" disabled={isSubmitting || !prompt.trim()}>
              {isSubmitting ? <span className={styles.spinner} /> : 'Generate'}
            </button>
          </form>
          <label className={styles.forceFailLabel}>
            <input
              type="checkbox"
              checked={forceFail}
              onChange={(e) => setForceFail(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>Force fail (for testing)</span>
          </label>
          {error && <p className={styles.error}>{error}</p>}
        </section>

        <section className={styles.jobs}>
          <h3>Today</h3>
          <div className={styles.jobList}>
            {generations.length === 0 ? (
              <p className={styles.empty}>No generations yet. Create your first one above!</p>
            ) : (
              generations.map((gen) => (
                <GenerationCard key={gen.id} generation={gen} onRetry={handleRetry} />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function GenerationCard({
  generation,
  onRetry,
}: {
  generation: GenerationResult;
  onRetry: (id: string) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (generation.status === 'PROCESSING' || generation.status === 'PENDING') {
      const startTime = generation.startedAt
        ? new Date(generation.startedAt).getTime()
        : new Date(generation.createdAt).getTime();

      const updateElapsed = () => {
        setElapsed((Date.now() - startTime) / 1000);
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 100);
      return () => clearInterval(interval);
    }

    // Show final elapsed time for completed generations
    if (generation.status === 'COMPLETE' && generation.completedAt && generation.startedAt) {
      setElapsed(
        (new Date(generation.completedAt).getTime() - new Date(generation.startedAt).getTime()) /
        1000,
      );
    }
  }, [generation.status, generation.startedAt, generation.createdAt, generation.completedAt]);

  const getStatusIcon = () => {
    switch (generation.status) {
      case 'PENDING':
        return <span className={styles.statusPending}>⏳</span>;
      case 'PROCESSING':
        return <span className={`${styles.statusProcessing} ${styles.pulse}`}>⚡</span>;
      case 'COMPLETE':
        return <span className={styles.statusCompleted}>✓</span>;
      case 'FAILED':
        return <span className={styles.statusFailed}>✕</span>;
    }
  };

  const getStatusClassName = () => {
    switch (generation.status) {
      case 'COMPLETE':
        return styles.jobCOMPLETED;
      default:
        return styles[`job${generation.status}`];
    }
  };

  return (
    <div className={`${styles.jobCard} ${getStatusClassName()}`}>
      <div className={styles.jobPreview}>
        {generation.status === 'COMPLETE' && generation.result ? (
          <Image
            src={generation.result}
            alt={`Generated image for: ${generation.prompt}`}
            width={100}
            height={100}
            className={styles.generatedImage}
          />
        ) : (
          <div className={styles.placeholder}>
            <svg viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="35" r="20" opacity="0.3" />
              <path d="M50 60 L30 90 L70 90 Z" opacity="0.3" />
              <polygon
                points="50,15 61,40 88,40 67,55 76,80 50,65 24,80 33,55 12,40 39,40"
                opacity="0.2"
              />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.jobInfo}>
        <p className={styles.jobPrompt}>{generation.prompt}</p>
        <div className={styles.jobMeta}>
          {getStatusIcon()}
          {(generation.status === 'PENDING' || generation.status === 'PROCESSING') && (
            <span className={styles.elapsed}>{elapsed.toFixed(2)}s</span>
          )}
          {generation.status === 'COMPLETE' && (
            <span className={styles.elapsed}>{elapsed.toFixed(2)}s</span>
          )}
          {generation.status === 'FAILED' && (
            <>
              <span className={styles.errorText}>{generation.error || 'Failed'}</span>
              <button onClick={() => onRetry(generation.id)} className={styles.retryButton}>
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
