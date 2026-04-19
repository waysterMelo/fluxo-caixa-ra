import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'ghost' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  loading = false,
  disabled,
  icon,
  ...props
}: ButtonProps) {
  const buttonClass = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${fullWidth ? styles.fullWidth : ''}
    ${loading ? styles.loading : ''}
    ${className}
  `.trim();

  return (
    <button className={buttonClass} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className={styles.spinner} size={16} />}
      {icon && !loading && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
