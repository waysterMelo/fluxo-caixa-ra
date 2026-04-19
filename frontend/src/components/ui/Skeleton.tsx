import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'text' | 'card' | 'metric' | 'table' | 'circle';
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ variant = 'text', width, height, lines = 1, className = '', style }: SkeletonProps) {
  if (variant === 'metric') {
    return (
      <div className={`${styles.metricCard} ${className}`}>
        <div className={`${styles.bone} ${styles.label}`} />
        <div className={`${styles.bone} ${styles.value}`} />
        <div className={`${styles.bone} ${styles.subtitle}`} />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={`${styles.bone} ${styles.cardTitle}`} />
        <div className={`${styles.bone} ${styles.cardBody}`} />
        <div className={`${styles.bone} ${styles.cardBody} ${styles.short}`} />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`${styles.tableContainer} ${className}`}>
        <div className={styles.tableRow}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${styles.bone} ${styles.tableCell}`} />
          ))}
        </div>
        {[...Array(5)].map((_, row) => (
          <div key={row} className={styles.tableRow}>
            {[...Array(5)].map((_, col) => (
              <div key={col} className={`${styles.bone} ${styles.tableCell}`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={`${styles.bone} ${styles.circle} ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  // Text variant
  return (
    <div className={`${styles.textContainer} ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`${styles.bone} ${styles.text} ${i === lines - 1 && lines > 1 ? styles.short : ''}`}
          style={{ width: width, height: height, ...style }}
        />
      ))}
    </div>
  );
}
