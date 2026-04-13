import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  variant?: 'default' | 'mono' | 'date';
  inputSize?: 'small' | 'default' | 'large';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', variant = 'default', inputSize = 'default', ...props }, ref) => {
    const containerClass = `
      ${styles.container} 
      ${styles[inputSize]} 
      ${variant !== 'default' ? styles[variant] : ''} 
      ${className}
    `.trim();

    return (
      <div className={containerClass}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          className={`${styles.input} ${error ? styles.error : ''} ${props.readOnly ? styles.readOnly : ''}`}
          {...props}
        />
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
