'use client';

/**
 * Global error boundary that catches errors in the root layout.
 * This is the last line of defense for unhandled errors.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: '#0a0a0f',
          color: '#f5f5f7',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>💥</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Critical Error
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: '#a1a1aa',
              lineHeight: 1.6,
              marginBottom: '1rem',
            }}
          >
            A critical error occurred. Please refresh the page or try again later.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#71717a',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: 'white',
              background: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
