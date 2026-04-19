import { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, filters, children }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.top}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {filters && <div className={styles.filters}>{filters}</div>}
      {children}
    </div>
  );
}
