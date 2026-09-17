import React, { useRef, useState } from 'react';
import './EditableText.css';

interface EditableTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder: string;
  ariaLabel: string;
  onCommit: (value: React.InputHTMLAttributes<HTMLInputElement>['value']) => void;
  className?: string;
}

const EditableText = ({ value, placeholder, ariaLabel, onCommit, width, className = '', type, ...props }: EditableTextProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const commitValue = (value: React.InputHTMLAttributes<HTMLInputElement>['value']) => {
    console.log("Committing", value);
    onCommit(value);
  };

  return (
    <span className={`editable-text ${className}`.trim()}>
      <input
        ref={inputRef}
        className="editable-text__input"
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        onChange={() => {
          commitValue(inputRef.current?.value);
        }}
        width={width}
        type={type}
        {...props}
      />
    </span>
  );
};

export default EditableText;
