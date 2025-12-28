import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found | AI Image Generator',
  description: 'The page you are looking for does not exist or has been moved.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.code}>404</div>
        <h1 style={styles.title}>Page not found</h1>
        <p style={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" style={styles.link}>
          Go back home
        </Link>
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
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  code: {
    fontSize: '6rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.75rem',
  },
  message: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  link: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'white',
    background: 'var(--accent-primary)',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
};
