import React from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './ErrorToast.css';

interface ErrorToastProps {
  message: string;
  action: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ErrorToast = ({ message, action, actionLabel, onAction }: ErrorToastProps) => {
  return (
    <aside className="error-toast" role="status" aria-live="polite">
      <p className="error-toast__message">{message}</p>
      <p className="error-toast__action">{action}</p>
      {actionLabel && onAction ? (
        <ActionButton variant="secondary" onClick={onAction}>
          {actionLabel}
        </ActionButton>
      ) : null}
    </aside>
  );
};

export default ErrorToast;
