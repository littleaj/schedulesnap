import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabeledInput from './LabeledInput';

describe('LabeledInput', () => {
  it('renders label, input value, and hint text', () => {
    render(
      <LabeledInput
        id="target-name"
        label="Name on schedule"
        hint="Use your preferred display name"
        value="Alex"
        onChange={() => undefined}
      />
    );

    expect(screen.getByLabelText(/name on schedule/i)).toHaveValue('Alex');
    expect(screen.getByText(/use your preferred display name/i)).toBeInTheDocument();
  });

  it('renders error text and calls onChange when edited', () => {
    const onChange = vi.fn();

    render(
      <LabeledInput
        id="target-name"
        label="Name on schedule"
        error="Name is required"
        value=""
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/name on schedule/i), { target: { value: 'Taylor' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
