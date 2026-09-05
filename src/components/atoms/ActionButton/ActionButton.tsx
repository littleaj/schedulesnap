import React from 'react';
import './ActionButton.css';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant: 'primary' | 'secondary' | '';
}

const ActionButton = ({ children, type = 'button', className = '', variant, ...props }: ActionButtonProps) => {
  return (
    <button type={type} className={`action-button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default ActionButton;
