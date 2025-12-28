import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Sign In | AI Image Generator',
  description: 'Sign in to your account to create AI-generated images with scheduled processing.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to continue to AI Image Generator</p>
        </div>
        <div className={styles.form}>
          <div className={styles.field}>
            <div style={{ height: 70, background: 'var(--bg-tertiary)', borderRadius: 8 }} />
          </div>
          <div className={styles.field}>
            <div style={{ height: 70, background: 'var(--bg-tertiary)', borderRadius: 8 }} />
          </div>
          <div style={{ height: 48, background: 'var(--bg-tertiary)', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}
