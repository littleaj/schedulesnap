import React, { type AriaRole, type ReactNode } from 'react';
import './MessageToast.css';

interface MessageToastProps {
  content: ReactNode;
  variant: string;
  role?: AriaRole;
}

const MessageToast = ({ content, variant, role = 'status' }: MessageToastProps) => {
  const liveRegionMode = role === 'alert' ? 'assertive' : 'polite';

  return (
    <aside className={`message-toast ${variant}`} role={role} aria-live={liveRegionMode}>
      {typeof content === 'string' ? (
        <p className="message-toast__content">{content}</p>
      ) : (
        <div className="message-toast__content">{content}</div>
      )}
    </aside>
  );
};

export default MessageToast;
