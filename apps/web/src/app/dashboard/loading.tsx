import styles from './dashboard.module.css';

export default function DashboardLoading() {
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
          <SkeletonBox width={120} height={16} />
          <SkeletonBox width={80} height={32} borderRadius={8} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.generator}>
          <SkeletonBox width={140} height={28} style={{ marginBottom: '1.25rem' }} />
          <div className={styles.form}>
            <SkeletonBox height={48} style={{ flex: 1, borderRadius: 10 }} />
            <SkeletonBox width={120} height={48} borderRadius={10} />
          </div>
        </section>

        <section className={styles.jobs}>
          <SkeletonBox width={60} height={14} style={{ marginBottom: '1rem' }} />
          <div className={styles.jobList}>
            {[1, 2, 3].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SkeletonBox({
  width,
  height,
  borderRadius = 4,
  style,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'var(--bg-tertiary)',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

function JobCardSkeleton() {
  return (
    <div className={styles.jobCard}>
      <div className={styles.jobPreview}>
        <SkeletonBox width="100%" height="100%" />
      </div>
      <div className={styles.jobInfo}>
        <SkeletonBox width="80%" height={20} style={{ marginBottom: 8 }} />
        <SkeletonBox width={100} height={16} />
      </div>
    </div>
  );
}
