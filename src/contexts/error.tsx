import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorDialog from '@/components/molecules/ErrorDialog/ErrorDialog';
import ErrorToast from '@/components/molecules/ErrorToast/ErrorToast';

const DEFAULT_TOAST_TIMEOUT_MS = 5000;

interface ErrorContent {
  message: string;
  action: string;
}

interface ToastError extends ErrorContent {
  actionLabel?: string;
  onAction?: () => void;
  timeoutMs?: number;
}

interface ModalError extends ErrorContent {
  acknowledgeLabel?: string;
  onAcknowledge?: () => void;
}

interface ErrorContextValue {
  showToast: (error: ToastError) => void;
  showModal: (error: ModalError) => void;
}

export const ErrorContext = React.createContext<ErrorContextValue | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [toastError, setToastError] = useState<ToastError | null>(null);
  const [modalQueue, setModalQueue] = useState<ModalError[]>([]);

  const showToast = useCallback((error: ToastError) => {
    setToastError(error);
  }, []);

  const showModal = useCallback((error: ModalError) => {
    setModalQueue(queue => [...queue, error]);
  }, []);

  const dismissModal = useCallback(() => {
    setModalQueue(([, ...remaining]) => remaining);
  }, []);

  const handleToastAction = useCallback(() => {
    toastError?.onAction?.();
    setToastError(null);
  }, [toastError]);

  const activeModal = modalQueue[0] ?? null;
  const timeoutMs = toastError?.timeoutMs && toastError.timeoutMs > 0
    ? toastError.timeoutMs
    : DEFAULT_TOAST_TIMEOUT_MS;

  useEffect(() => {
    if (!toastError) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastError(null);
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [timeoutMs, toastError]);

  const value = useMemo(() => ({ showToast, showModal }), [showModal, showToast]);

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {toastError ? (
        <ErrorToast
          message={toastError.message}
          action={toastError.action}
          actionLabel={toastError.actionLabel}
          onAction={handleToastAction}
        />
      ) : null}
      {activeModal ? (
        <ErrorDialog
          message={activeModal.message}
          action={activeModal.action}
          acknowledgeLabel={activeModal.acknowledgeLabel}
          onAcknowledge={() => {
            activeModal.onAcknowledge?.();
            dismissModal();
          }}
        />
      ) : null}
    </ErrorContext.Provider>
  );
};
