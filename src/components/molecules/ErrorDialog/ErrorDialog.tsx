import React from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './ErrorDialog.css';

interface ErrorDialogProps {
  message: string;
  action: string;
  acknowledgeLabel?: string;
  onAcknowledge: () => void;
}

const ErrorDialog = ({ message, action, acknowledgeLabel = 'Got it', onAcknowledge }: ErrorDialogProps) => {
  return (
    <div className="error-dialog__backdrop">
      <dialog
        className="error-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-dialog-title"
        open
      >
        <h2 id="error-dialog-title">{message}</h2>
        <p>{action}</p>
        <div className="error-dialog__actions">
          <ActionButton variant="primary" onClick={onAcknowledge}>{acknowledgeLabel}</ActionButton>
        </div>
      </dialog>
    </div>
  );
};

export default ErrorDialog;
