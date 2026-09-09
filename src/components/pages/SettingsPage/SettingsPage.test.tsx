import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from './SettingsPage';

const { submitMock } = vi.hoisted(() => ({
  submitMock: vi.fn(),
}));

vi.mock('@/hooks/user-profile-form', () => ({
  useUserProfileForm: () => ({
    values: {
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: {
        enabled: true,
        minutesBefore: 60,
      },
    },
    errors: {},
    isLoading: false,
    isSubmitting: false,
    errorMessage: null,
    successMessage: 'Profile saved',
    setTargetName: vi.fn(),
    setTimezone: vi.fn(),
    setDefaultCalendarId: vi.fn(),
    setReminderEnabled: vi.fn(),
    setReminderMinutesBefore: vi.fn(),
    submit: submitMock,
  }),
}));

describe('SettingsPage', () => {
  it('renders settings heading and save action', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
  });

  it('shows save feedback and triggers save when submitted', async () => {
    submitMock.mockResolvedValue(true);
    render(<SettingsPage />);

    expect(screen.getByText(/profile saved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledTimes(1);
    });
  });
});
