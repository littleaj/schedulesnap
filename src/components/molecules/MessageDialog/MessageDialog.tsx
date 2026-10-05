import React, { useEffect, useId, useRef, type ReactNode } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './MessageDialog.css';

interface MessageDialogProps {
  heading?: string;
  content: ReactNode;
  actionLabels?: string[];
  /**
   * The variant of the message dialog, which determines its visual style via a class of the same name.
   *
   * NOTE: When adding values, a corresponding class should be added to the CSS to style the dialog appropriately.
   */
  variant: 'error' | 'warning' | 'success' | 'information';
  title: string;
  closeable?: boolean;
  onAcknowledge: (label: string | null) => void;
}

const MessageDialog = ({
  heading,
  content,
  actionLabels = ['OK'],
  variant,
  title,
  closeable = true,
  onAcknowledge,
}: MessageDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (closeable) {
        onAcknowledge(null);
      }
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
  }, [closeable, onAcknowledge]);

  return (
    <dialog
      ref={dialogRef}
      className={`message-dialog ${variant}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="message-dialog__title-bar">
        <strong className="message-dialog__title" id={titleId}>{title}</strong>
        <button
          type="button"
          className="message-dialog__close"
          aria-label="Close message"
          onClick={() => onAcknowledge(null)}
          hidden={!closeable}
        >
          <span className="material-symbols-outlined" aria-hidden="true">{'\ue5cd'}</span>
        </button>
      </div>
      {heading ? <h2 id={headingId}>{heading}</h2> : null}
      {typeof content === 'string' ? (
        <p className="message-dialog__content">{content}</p>
      ) : (
        <div className="message-dialog__content">{content}</div>
      )}
      <div className="message-dialog__actions">
        {actionLabels.map((label, index) => (
          <ActionButton key={`${label}-${index}`} variant="primary" onClick={() => onAcknowledge(label)}>{label}</ActionButton>
        ))}
      </div>
    </dialog>
  );
};

export default MessageDialog;
