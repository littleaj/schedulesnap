import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabeledSelect from './LabeledSelect';

describe('LabeledSelect', () => {
  const options = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New_York' },
  ];

  it('renders options and selected value', () => {
    render(
      <LabeledSelect
        id="timezone"
        label="Timezone"
        value="UTC"
        options={options}
        onChange={() => undefined}
      />
    );

    expect(screen.getByLabelText(/timezone/i)).toHaveValue('UTC');
    expect(screen.getByRole('option', { name: 'America/New_York' })).toBeInTheDocument();
  });

  it('calls onChange when user selects a new option', () => {
    const onChange = vi.fn();

    render(
      <LabeledSelect
        id="timezone"
        label="Timezone"
        value="UTC"
        options={options}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/timezone/i), { target: { value: 'America/New_York' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
