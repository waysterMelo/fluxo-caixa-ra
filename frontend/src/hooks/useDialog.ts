import { useState, useCallback, ReactNode } from 'react';
import { Dialog, DialogVariant } from '../components/ui/Dialog';

export interface UseDialogOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

export interface UseDialogReturn {
  isOpen: boolean;
  open: (options?: Partial<UseDialogOptions>) => void;
  close: () => void;
  onConfirm: () => void;
  onClose: () => void;
  options: UseDialogOptions;
}

export function useDialog(
  defaultOptions: UseDialogOptions,
  onConfirmCallback?: () => void | Promise<void>
): UseDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseDialogOptions>(defaultOptions);

  const open = useCallback((newOptions?: Partial<UseDialogOptions>) => {
    if (newOptions) {
      setOptions(prev => ({ ...prev, ...newOptions }));
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onClose = useCallback(() => {
    close();
  }, [close]);

  const onConfirm = useCallback(async () => {
    if (onConfirmCallback) {
      await onConfirmCallback();
    }
    close();
  }, [onConfirmCallback, close]);

  return {
    isOpen,
    open,
    close,
    onConfirm,
    onClose,
    options,
  };
}

// Hooks especializados para cada tipo de modal
export function useConfirmationDialog(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: Partial<Omit<UseDialogOptions, 'title' | 'message'>>
) {
  return useDialog(
    {
      title,
      message,
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      variant: 'primary',
      ...options,
    },
    onConfirm
  );
}

export function useDeleteDialog(
  itemName: string,
  onConfirm: () => void | Promise<void>
) {
  return useConfirmationDialog(
    `Excluir ${itemName}`,
    `Deseja realmente excluir ${itemName}? Essa ação não poderá ser desfeita.`,
    onConfirm,
    { variant: 'danger', confirmLabel: 'Excluir' }
  );
}

export function useErrorDialog(
  title: string,
  message: string,
  onConfirm?: () => void
) {
  return useDialog(
    {
      title,
      message,
      confirmLabel: 'Fechar',
      variant: 'error',
      cancelLabel: undefined,
    },
    onConfirm
  );
}

export function useSuccessDialog(
  title: string,
  message: string,
  onConfirm?: () => void
) {
  return useDialog(
    {
      title,
      message,
      confirmLabel: 'OK',
      variant: 'success',
      cancelLabel: undefined,
    },
    onConfirm
  );
}

export function useWarningDialog(
  title: string,
  message: string,
  onConfirm?: () => void
) {
  return useDialog(
    {
      title,
      message,
      confirmLabel: 'Entendi',
      variant: 'warning',
      cancelLabel: undefined,
    },
    onConfirm
  );
}
