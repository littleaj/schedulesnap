import React, { useEffect, useRef, useState } from 'react';
import './EditableText.css';

interface EditableTextProps {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onCommit: (value: string) => void;
  className?: string;
}

const ConfirmIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M9.2 16.2 4.8 11.8l-1.6 1.6 6 6L21 8.6 19.4 7z" />
  </svg>
);

const CancelIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6.4 5-1.4 1.4L10.6 12 5 17.6 6.4 19 12 13.4 17.6 19l1.4-1.4L13.4 12 19 6.4 17.6 5 12 10.6z" />
  </svg>
);

const EditableText = ({ value, placeholder, ariaLabel, onCommit, className = '' }: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value);
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitValue = () => {
    try {
      onCommit(draftValue);
    } finally {
      setIsEditing(false);
      inputRef.current?.blur();
      okRef.current?.blur();
    }
  };

  const cancelEdit = () => {
    setDraftValue(value);
    setIsEditing(false);
    inputRef.current?.blur();
    cancelRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitValue();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  };

  return (
    <span className={`editable-text ${className}`.trim()}>
      {isEditing || !value ? (
        <span className="editable-text__editor">
          <input
            ref={inputRef}
            className="editable-text__input"
            aria-label={ariaLabel}
            value={draftValue}
            placeholder={placeholder}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="editable-text__actions">
            <button ref={okRef} type="button" className="editable-text__icon-button" aria-label="OK" onClick={commitValue}>
              <ConfirmIcon />
            </button>
            <button ref={cancelRef} type="button" className="editable-text__icon-button" aria-label="Cancel" onClick={cancelEdit}>
              <CancelIcon />
            </button>
          </span>
        </span>
      ) : (
        <span // NOSONAR - role="button" is intended
          className={`editable-text__display ${value ? '' : 'editable-text__display--placeholder'}`.trim()}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onDoubleClick={() => setIsEditing(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsEditing(true);
            }
          }}
        >
          {value}
        </span>
      )}
    </span>
  );
};

export default EditableText;
