import React, { type AriaRole, type ReactNode } from 'react';
import './MessageToast.css';

interface MessageToastProps {
  title?: string;
  content: ReactNode;
  /**
   * The variant of the message toast, which determines its visual style via a class of the same name.
   *
   * NOTE: When adding values, a corresponding class should be added to the CSS to style the toast appropriately.
   */
  variant: 'error' | 'warning' | 'success' | 'information';
  role?: AriaRole;
  onDismiss?: () => void;
}

const MessageToast = ({ title, content, variant, role = 'status', onDismiss }: MessageToastProps) => {
  const liveRegionMode = role === 'alert' ? 'assertive' : 'polite';

  return (
    <aside className={`message-toast ${variant}`} role={role} aria-live={liveRegionMode}>
      <div className="message-toast__title-bar">
        {title ? (
          <strong className="message-toast__title">{title}</strong>
        ) : null}
        <button
          type="button"
          className="material-symbols-outlined message-toast__close"
          aria-label="Close toast"
          onClick={onDismiss}
        >
          {'\ue5cd'}
        </button>
      </div>
      {typeof content === 'string' ? (
        <p className="message-toast__content">{content}</p>
      ) : (
        <div className="message-toast__content">{content}</div>
      )}
    </aside>
  );
};

export default MessageToast;
