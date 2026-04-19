import { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import styles from './Dialog.module.css';

export type DialogVariant = 'danger' | 'warning' | 'primary' | 'success' | 'error' | 'info';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  loading?: boolean;
  showCancel?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
  showCancel = true,
}: DialogProps) {
  const iconMap: Record<DialogVariant, ReactNode> = {
    danger: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    error: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    primary: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    success: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    info: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  const getButtonVariant = (v: DialogVariant): 'danger' | 'warning' | 'primary' | 'success' => {
    if (v === 'danger' || v === 'error') return 'danger';
    if (v === 'warning') return 'warning';
    if (v === 'success') return 'success';
    return 'primary';
  };

  const buttonVariant = getButtonVariant(variant);
  const hasConfirm = !!onConfirm;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      size="small"
      footer={
        <div className={styles.footer}>
          {showCancel && (
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
          )}
          {hasConfirm && (
            <Button variant={buttonVariant} onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          )}
          {!hasConfirm && !showCancel && (
            <Button variant={buttonVariant} onClick={onClose}>
              {confirmLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.content}>
        <div className={`${styles.icon} ${styles[variant]}`}>
          {iconMap[variant]}
        </div>
        <div className={styles.message}>{message}</div>
      </div>
    </Modal>
  );
}
