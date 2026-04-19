import { ReactNode } from 'react';
import { Circle } from 'lucide-react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'xs' | 'small' | 'default' | 'large';
  withDot?: boolean;
  className?: string;
}

export type BadgeVariant = BadgeProps['variant'];
export type BadgeSize = BadgeProps['size'];

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
    ${className}
  `.trim();

  return (
    <span className={badgeClass}>
      {withDot && (
        <Circle 
          className={`${styles.dot} ${styles[`dot-${variant}`]}`} 
          size={size === 'xs' ? 5 : size === 'small' ? 6 : 7} 
          fill="currentColor" 
        />
      )}
      {children}
    </span>
  );
}
