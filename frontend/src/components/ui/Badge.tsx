import { ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'default' | 'large';
  withDot?: boolean;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'default',
  withDot = false,
  className = '' 
}: BadgeProps) {
  const badgeClass = `
    ${styles.badge} 
    ${styles[variant]} 
    ${styles[size]} 
    ${withDot ? styles.withDot : ''} 
    ${className}
  `.trim();

  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
}
