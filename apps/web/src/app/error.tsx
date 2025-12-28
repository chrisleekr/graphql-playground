'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>⚠️</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.message}>
          An unexpected error occurred. Please try again or contact support if the problem
          persists.
        </p>
        {error.digest && <p style={styles.digest}>Error ID: {error.digest}</p>}
        <div style={styles.actions}>
          <button onClick={reset} style={styles.primaryButton}>
            Try again
          </button>
          <button onClick={() => (window.location.href = '/')} style={styles.secondaryButton}>
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--bg-primary)',
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
  },
  message: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },
  digest: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontFamily: "var(--font-mono), monospace",
    marginBottom: '1.5rem',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'white',
    background: 'var(--accent-primary)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
