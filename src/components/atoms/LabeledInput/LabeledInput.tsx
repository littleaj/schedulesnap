import React from 'react';
import './LabeledInput.css';

interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

const LabeledInput = ({ id, label, hint, error, ...props }: LabeledInputProps) => {
  const messageId = `${id}-message`;
  let message: React.ReactNode = null;

  if (error) {
    message = <p className="labeled-input__error" id={messageId} role="alert">{error}</p>;
  } else if (hint) {
    message = <p className="labeled-input__hint" id={messageId}>{hint}</p>;
  }

  return (
    <div className="labeled-input">
      <label className="labeled-input__label" htmlFor={id}>{label}</label>
      <input
        className="labeled-input__control"
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
        {...props}
      />
      {message}
    </div>
  );
};

export default LabeledInput;
