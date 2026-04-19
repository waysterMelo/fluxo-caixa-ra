import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
      ${error ? styles.hasError : ''}
      ${className}
    `.trim();

    return (
      <div className={containerClass}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            className={`${styles.input} ${error ? styles.error : ''} ${props.readOnly ? styles.readOnly : ''}`}
            {...props}
          />
          {error && (
            <span className={styles.iconError}>
              <AlertCircle size={16} />
            </span>
          )}
          {!error && props.readOnly && (
            <span className={styles.iconReadOnly}>
              <CheckCircle2 size={16} />
            </span>
          )}
        </div>
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
