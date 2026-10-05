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

type UserMessage = QueuedToastMessage | QueuedModalMessage;

interface UserMessageContextValue {
  showToast: (message: ToastMessage) => void;
  showModal: (message: ModalMessage) => Promise<string | null>;
}

export const UserMessageContext = React.createContext<UserMessageContextValue | undefined>(undefined);

export const UserMessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<UserMessage[]>([]);
  const nextMessageId = useRef(0);

  const showToast = useCallback((message: ToastMessage) => {
    nextMessageId.current += 1;
    setQueue((currentQueue) => [...currentQueue, { id: nextMessageId.current, kind: 'toast', ...message }]);
  }, []);

  const showModal = useCallback((message: ModalMessage) => {
    const modalId = nextMessageId.current + 1;
    nextMessageId.current = modalId;

    return new Promise<string | null>((resolve) => {
      setQueue((currentQueue) => [
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

  const dismissActiveMessage = useCallback(() => {
    setQueue(([, ...remaining]) => remaining);
  }, []);

  const activeMessage = queue[0] ?? null;

  const handleModalAcknowledge = useCallback((label: string | null) => {
    if (activeMessage?.kind === 'modal') {
      activeMessage.onAcknowledge?.(label);
    }

    dismissActiveMessage();
  }, [activeMessage, dismissActiveMessage]);

  const activeToastId = activeMessage?.kind === 'toast' ? activeMessage.id : null;
  const activeToastTimeoutMs = activeMessage?.kind === 'toast' && activeMessage.timeoutMs && activeMessage.timeoutMs > 0
    ? activeMessage.timeoutMs
    : DEFAULT_TOAST_TIMEOUT_MS;

  useEffect(() => {
    if (activeToastId === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      dismissActiveMessage();
    }, activeToastTimeoutMs);

    return () => window.clearTimeout(timer);
  }, [activeToastId, activeToastTimeoutMs, dismissActiveMessage]);

  const value = useMemo(() => ({ showToast, showModal }), [showModal, showToast]);

  return (
    <UserMessageContext.Provider value={value}>
      {children}
      {activeMessage?.kind === 'toast' ? (
        <MessageToast
          title={activeMessage.title}
          content={activeMessage.content}
          variant={activeMessage.variant}
          role={activeMessage.role}
          onDismiss={dismissActiveMessage}
        />
      ) : null}
      {activeMessage?.kind === 'modal' ? (
        <MessageDialog
          title={activeMessage.title}
          heading={activeMessage.heading}
          content={activeMessage.content}
          variant={activeMessage.variant}
          actionLabels={activeMessage.actionLabels}
          closeable={activeMessage.closeable}
          onAcknowledge={handleModalAcknowledge}
        />
      ) : null}
    </UserMessageContext.Provider>
  );
};
