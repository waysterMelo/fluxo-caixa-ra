import { ReactNode } from 'react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  footer?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'default' | 'large' | 'xlarge';
  density?: 'compact' | 'default' | 'relaxed';
  valueClassName?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  footer,
  badge,
  icon,
  trend,
  variant = 'default',
  size = 'default',
  density = 'default',
  valueClassName = '',
  className = '',
}: MetricCardProps) {
  const cardClass = `
    ${styles.metricCard} 
    ${variant !== 'default' ? styles[variant] : ''} 
    ${density !== 'default' ? styles[density] : ''} 
    ${className}
  `.trim();

  const valueClass = `
    ${styles.value} 
    ${styles[size]} 
    ${valueClassName}
  `.trim();

  return (
    <div className={cardClass}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {badge}
          {icon && <span className={styles.icon}>{icon}</span>}
        </div>
      </div>

      <div className={valueClass}>{value}</div>

      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}

      {trend && (
        <div className={`${styles.trend} ${styles[trend.direction]}`}>
          <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
          <span>{trend.value}</span>
        </div>
      )}

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
