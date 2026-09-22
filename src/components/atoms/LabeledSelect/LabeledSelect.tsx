import React from 'react';
import './LabeledSelect.css';

interface SelectOption {
  value: string;
  label: string;
}

interface LabeledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
}

const LabeledSelect = ({ id, label, options, hint, error, value, ...props }: LabeledSelectProps) => {
  const messageId = `${id}-message`;
  let message: React.ReactNode = null;

  if (error) {
    message = <p className="labeled-select__error" id={messageId} role="alert">{error}</p>;
  } else if (hint) {
    message = <p className="labeled-select__hint" id={messageId}>{hint}</p>;
  }

  return (
    <div className="labeled-select">
      <label className="labeled-select__label" htmlFor={id}>{label}</label>
      <select
        className="labeled-select__control"
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? messageId : undefined}
        value={value}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {message}
    </div>
  );
};

export default LabeledSelect;
