import React, { type AriaRole, type ReactNode } from 'react';
import './ErrorToast.css';

interface MessageToastProps {
  content: ReactNode;
  variant: string;
  role?: AriaRole;
}

const MessageToast = ({ content, variant, role = 'status' }: MessageToastProps) => {
  return (
    <aside className={`message-toast ${variant}`} role={role} aria-live="polite">
      {typeof content === 'string' ? (
        <p className="message-toast__content">{content}</p>
      ) : (
        <div className="message-toast__content">{content}</div>
      )}
    </aside>
  );
};

export default MessageToast;
