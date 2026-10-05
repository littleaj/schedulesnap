import React, { useCallback, useEffect, useMemo, useState, type AriaRole, type ReactNode } from 'react';
import MessageDialog from '@/components/molecules/ErrorDialog/ErrorDialog';
import MessageToast from '@/components/molecules/ErrorToast/ErrorToast';

const DEFAULT_TOAST_TIMEOUT_MS = 5000;

export interface ToastMessage {
  content: ReactNode;
  variant: string;
  timeoutMs?: number;
  role?: AriaRole;
}

export interface ModalMessage {
  title: string;
  heading: string;
  content: ReactNode;
  variant: string;
  actionLabels?: string[];
  closeable?: boolean;
  onAcknowledge?: (label: string | null) => void;
}

interface QueuedToastMessage extends ToastMessage {
  kind: 'toast';
}

interface QueuedModalMessage extends ModalMessage {
  kind: 'modal';
}

type UserMessage = QueuedToastMessage | QueuedModalMessage;

interface UserMessageContextValue {
  showToast: (message: ToastMessage) => void;
  showModal: (message: ModalMessage) => void;
}

export const UserMessageContext = React.createContext<UserMessageContextValue | undefined>(undefined);

export const UserMessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<UserMessage[]>([]);

  const showToast = useCallback((message: ToastMessage) => {
    setQueue((currentQueue) => [...currentQueue, { kind: 'toast', ...message }]);
  }, []);

  const showModal = useCallback((message: ModalMessage) => {
    setQueue((currentQueue) => [...currentQueue, { kind: 'modal', ...message }]);
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

  useEffect(() => {
    if (!activeMessage || activeMessage.kind !== 'toast') {
      return;
    }

    const timeoutMs = activeMessage.timeoutMs && activeMessage.timeoutMs > 0
      ? activeMessage.timeoutMs
      : DEFAULT_TOAST_TIMEOUT_MS;

    const timer = window.setTimeout(() => {
      dismissActiveMessage();
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [activeMessage, dismissActiveMessage]);

  const value = useMemo(() => ({ showToast, showModal }), [showModal, showToast]);

  return (
    <UserMessageContext.Provider value={value}>
      {children}
      {activeMessage?.kind === 'toast' ? (
        <MessageToast
          content={activeMessage.content}
          variant={activeMessage.variant}
          role={activeMessage.role}
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
