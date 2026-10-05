import React, { type AriaRole, type ReactNode } from 'react';
import './MessageToast.css';

interface MessageToastProps {
  title?: string;
  content: ReactNode;
  variant: string;
  role?: AriaRole;
}

const MessageToast = ({ title, content, variant, role = 'status' }: MessageToastProps) => {
  const liveRegionMode = role === 'alert' ? 'assertive' : 'polite';

  return (
    <aside className={`message-toast ${variant}`} role={role} aria-live={liveRegionMode}>
      {title ? (
        <div className="message-toast__title-bar">
          <strong className="message-toast__title">{title}</strong>
        </div>
      ) : null}
      {typeof content === 'string' ? (
        <p className="message-toast__content">{content}</p>
      ) : (
        <div className="message-toast__content">{content}</div>
      )}
    </aside>
  );
};

export default MessageToast;
