import React, { useEffect, useId, useRef } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './ErrorDialog.css';

interface ErrorDialogProps {
  message: string;
  action: string;
  acknowledgeLabel?: string;
  onAcknowledge: () => void;
}

const ErrorDialog = ({ message, action, acknowledgeLabel = 'Got it', onAcknowledge }: ErrorDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onAcknowledge();
    };

    dialog.addEventListener('cancel', handleCancel);

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) {
        dialog.showModal();
      }

      return () => {
        dialog.removeEventListener('cancel', handleCancel);
        if (dialog.open) {
          dialog.close();
        }
      };
    }

    dialog.setAttribute('open', '');

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeAttribute('open');
    };
  }, [onAcknowledge]);

  return (
    <dialog
      ref={dialogRef}
      className="error-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{message}</h2>
      <p>{action}</p>
      <div className="error-dialog__actions">
        <ActionButton variant="primary" onClick={onAcknowledge}>{acknowledgeLabel}</ActionButton>
      </div>
    </dialog>
  );
};

export default ErrorDialog;
