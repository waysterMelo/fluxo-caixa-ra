import { SelectHTMLAttributes, forwardRef } from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  selectSize?: 'small' | 'default' | 'large';
  loading?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className = '', selectSize = 'default', loading = false, disabled, ...props }, ref) => {
    const containerClass = `${styles.container} ${styles[selectSize]} ${className}`.trim();

    return (
      <div className={containerClass}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            className={`${styles.select} ${error ? styles.error : ''}`}
            disabled={disabled || loading}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.chevron}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
