import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Circle } from 'lucide-react';
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
  style?: React.CSSProperties;
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
  style,
}: MetricCardProps) {
  const cardClass = `
    ${styles.metricCard}
    ${styles.gradientBg}
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
    <div className={cardClass} style={style}>
      <div className={styles.statusBar} />
      
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {icon && <span className={styles.iconWrapper}>{icon}</span>}
          <span className={styles.label}>{label}</span>
        </div>
        {badge && <div className={styles.badge}>{badge}</div>}
      </div>

      <div className={valueClass}>{value}</div>

      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}

      {trend && (
        <div className={`${styles.trend} ${styles[trend.direction]}`}>
          {trend.direction === 'up' && <ArrowUpRight size={14} />}
          {trend.direction === 'down' && <ArrowDownRight size={14} />}
          {trend.direction === 'neutral' && <Minus size={14} />}
          <span>{trend.value}</span>
        </div>
      )}

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

// Componente auxiliar para dot de status
export function StatusDot({ variant }: { variant: 'success' | 'warning' | 'error' | 'info' }) {
  return <Circle className={`${styles.statusDot} ${styles[variant]}`} size={8} fill="currentColor" />;
}
