import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReminderSettings from './ReminderSettings';

describe('ReminderSettings', () => {
  it('shows reminder minutes when reminders are enabled', () => {
    render(
      <ReminderSettings
        enabled
        minutesBefore={60}
        onEnabledChange={() => undefined}
        onMinutesBeforeChange={() => undefined}
      />
    );

    expect(screen.getByLabelText(/enable reminders/i)).toBeChecked();
    expect(screen.getByLabelText(/minutes before/i)).toHaveValue(60);
  });

  it('calls change handlers when toggled and edited', () => {
    const onEnabledChange = vi.fn();
    const onMinutesBeforeChange = vi.fn();

    const { rerender } = render(
      <ReminderSettings
        enabled
        minutesBefore={60}
        onEnabledChange={onEnabledChange}
        onMinutesBeforeChange={onMinutesBeforeChange}
      />
    );

    fireEvent.click(screen.getByLabelText(/enable reminders/i));
    expect(onEnabledChange).toHaveBeenCalledWith(false);

    rerender(
      <ReminderSettings
        enabled
        minutesBefore={60}
        onEnabledChange={onEnabledChange}
        onMinutesBeforeChange={onMinutesBeforeChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/minutes before/i), { target: { value: '30' } });
    expect(onMinutesBeforeChange).toHaveBeenCalledWith(30);
  });
});
