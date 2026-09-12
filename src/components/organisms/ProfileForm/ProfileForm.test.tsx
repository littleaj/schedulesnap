import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import ProfileForm from './ProfileForm';

describe('ProfileForm', () => {
  const renderForm = (props: Partial<React.ComponentProps<typeof ProfileForm>> = {}) => render(
    <GoogleOAuthTokenContext.Provider value={{ getToken: () => 'fake-token', setToken: vi.fn() }}>
      <ProfileForm
        heading="Profile setup"
        subheading="Tell us about your schedule preferences"
        values={{
          targetName: 'Alex',
          timezone: 'UTC',
          defaultCalendarId: '',
          reminder: {
            enabled: true,
            minutesBefore: 60,
          },
        }}
        errors={{}}
        isLoading={false}
        isSubmitting={false}
        submitLabel="Save profile"
        onTargetNameChange={() => undefined}
        onTimezoneChange={() => undefined}
        onDefaultCalendarIdChange={() => undefined}
        onReminderEnabledChange={() => undefined}
        onReminderMinutesChange={() => undefined}
        onSubmit={() => undefined}
        {...props}
      />
    </GoogleOAuthTokenContext.Provider>
  );

  it('renders all profile fields and submit label', () => {
    renderForm();

    expect(screen.getByRole('heading', { name: /profile setup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name on schedule/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/default calendar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enable reminders/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
  });

  it('calls field handlers and submit handler when user interacts', () => {
    const onTargetNameChange = vi.fn();
    const onTimezoneChange = vi.fn();
    const onDefaultCalendarIdChange = vi.fn();
    const onReminderEnabledChange = vi.fn();
    const onReminderMinutesChange = vi.fn();
    const onSubmit = vi.fn();

    renderForm({
      values: {
        targetName: 'Alex',
        timezone: 'UTC',
        defaultCalendarId: 'primary',
        reminder: {
          enabled: true,
          minutesBefore: 60,
        },
      },
      onTargetNameChange,
      onTimezoneChange,
      onDefaultCalendarIdChange,
      onReminderEnabledChange,
      onReminderMinutesChange,
      onSubmit,
    });

    fireEvent.change(screen.getByLabelText(/name on schedule/i), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText(/timezone/i), { target: { value: 'America/Chicago' } });
    fireEvent.change(screen.getByLabelText(/default calendar/i), { target: { value: 'primary' } });
    fireEvent.click(screen.getByLabelText(/enable reminders/i));
    fireEvent.change(screen.getByLabelText(/minutes before/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    expect(onTargetNameChange).toHaveBeenCalledWith('Taylor');
    expect(onTimezoneChange).toHaveBeenCalledWith('America/Chicago');
    expect(onDefaultCalendarIdChange).toHaveBeenCalledWith('primary');
    expect(onReminderEnabledChange).toHaveBeenCalledWith(false);
    expect(onReminderMinutesChange).toHaveBeenCalledWith(30);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
