import { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  variant?: 'default' | 'metric' | 'statusCard' | 'simple' | 'elevated' | 'hero';
  status?: 'success' | 'warning' | 'error' | 'info';
  density?: 'compact' | 'default' | 'relaxed';
  onClick?: () => void;
  selected?: boolean;
}

export function Card({
  title,
  subtitle,
  children,
  footer,
  headerAction,
  className = '',
  variant = 'default',
  status,
  density = 'default',
  onClick,
  selected = false,
}: CardProps) {
  const hasHeader = title || headerAction;

  const cardClass = `
    ${styles.card}
    ${styles[variant]}
    ${status ? styles[status] : ''}
    ${density !== 'default' ? styles[density] : ''}
    ${onClick ? styles.clickable : ''}
    ${selected ? styles.selected : ''}
    ${className}
  `.trim();

  if (variant === 'metric') {
    return (
      <div className={cardClass} onClick={onClick}>
        <div className={styles.content}>
          {title && <div className={styles.title}>{title}</div>}
          <div className={styles.metricValue}>{children}</div>
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={cardClass} onClick={onClick}>
        <div className={styles.heroContent}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass} onClick={onClick}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {title && <div className={styles.title}>{title}</div>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {headerAction && <div className={styles.headerRight}>{headerAction}</div>}
        </div>
      )}
      <div className={`${styles.content} ${density === 'compact' ? styles.compact : ''}`}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
