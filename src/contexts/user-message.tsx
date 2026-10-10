import React, { useCallback, useEffect, useMemo, useRef, useState, type AriaRole, type ReactNode } from 'react';
import MessageDialog from '@/components/molecules/MessageDialog/MessageDialog';
import MessageToast from '@/components/molecules/MessageToast/MessageToast';

const DEFAULT_TOAST_TIMEOUT_MS = 5000;

export type MessageVariant = 'error' | 'warning' | 'success' | 'information';

export interface ToastMessage {
  title?: string;
  content: ReactNode;
  variant: MessageVariant;
  timeoutMs?: number;
  role?: AriaRole;
}

export interface ModalMessage {
  title: string;
  heading?: string;
  content: ReactNode;
  variant: MessageVariant;
  actionLabels?: string[];
  closeable?: boolean;
  onAcknowledge?: (label: string | null) => void;
}

interface QueuedMessageBase {
  id: number;
}

interface QueuedToastMessage extends ToastMessage, QueuedMessageBase {
  kind: 'toast';
}

interface QueuedModalMessage extends ModalMessage, QueuedMessageBase {
  kind: 'modal';
}

interface UserMessageContextValue {
  showToast: (message: ToastMessage) => number;
  dismissToast: (toastId?: number) => void;
  showModal: (message: ModalMessage) => Promise<string | null>;
}

export const UserMessageContext = React.createContext<UserMessageContextValue | undefined>(undefined);

export const UserMessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [toastQueue, setToastQueue] = useState<QueuedToastMessage[]>([]);
  const [modalQueue, setModalQueue] = useState<QueuedModalMessage[]>([]);
  const nextMessageId = useRef(0);

  const showToast = useCallback((message: ToastMessage) => {
    const messageId = nextMessageId.current++;
    setToastQueue((currentQueue) => [...currentQueue, { id: messageId, kind: 'toast', ...message }]);
    return messageId;
  }, []);

  const dismissToast = useCallback((toastId?: number) => {
    setToastQueue((currentQueue) => {
      if (toastId === undefined) {
        return currentQueue.slice(1);
      }

      return currentQueue.filter((toast) => toast.id !== toastId);
    });
  }, []);

  const showModal = useCallback((message: ModalMessage) => {
    const modalId = nextMessageId.current + 1;
    nextMessageId.current = modalId;

    return new Promise<string | null>((resolve) => {
      setModalQueue((currentQueue) => [
        ...currentQueue,
        {
          id: modalId,
          kind: 'modal',
          ...message,
          onAcknowledge: (label: string | null) => {
            try {
              message.onAcknowledge?.(label);
            } finally {
              resolve(label);
            }
          },
        },
      ]);
    });
  }, []);

  const dismissActiveToast = useCallback(() => {
    setToastQueue(([, ...remaining]) => remaining);
  }, []);

  const dismissActiveModal = useCallback((label: string | null = null) => {
    setModalQueue((currentQueue) => {
      const [activeModal, ...remaining] = currentQueue;
      activeModal?.onAcknowledge?.(label);
      return remaining;
    });
  }, []);

  const activeToast = toastQueue[0] ?? null;
  const activeModal = modalQueue[0] ?? null;

  const handleModalAcknowledge = useCallback((label: string | null) => {
    dismissActiveModal(label);
  }, [dismissActiveModal]);

  const activeToastId = activeToast?.id ?? null;
  const activeToastTimeoutMs = activeToast?.timeoutMs && activeToast.timeoutMs > 0
    ? activeToast.timeoutMs
    : DEFAULT_TOAST_TIMEOUT_MS;

  useEffect(() => {
    if (activeToastId === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      dismissActiveToast();
    }, activeToastTimeoutMs);

    return () => window.clearTimeout(timer);
  }, [activeToastId, activeToastTimeoutMs, dismissActiveToast]);

  const value = useMemo(() => ({ showToast, dismissToast, showModal }), [dismissToast, showModal, showToast]);

  return (
    <UserMessageContext.Provider value={value}>
      {children}
      {activeToast ? (
        <MessageToast
          title={activeToast.title}
          content={activeToast.content}
          variant={activeToast.variant}
          role={activeToast.role}
          onDismiss={dismissActiveToast}
        />
      ) : null}
      {activeModal ? (
        <MessageDialog
          title={activeModal.title}
          heading={activeModal.heading}
          content={activeModal.content}
          variant={activeModal.variant}
          actionLabels={activeModal.actionLabels}
          closeable={activeModal.closeable}
          onAcknowledge={handleModalAcknowledge}
        />
      ) : null}
    </UserMessageContext.Provider>
  );
};
