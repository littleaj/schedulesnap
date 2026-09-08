import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OnboardingPage from './OnboardingPage';

const { navigateMock, submitMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  submitMock: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/useUserProfileForm', () => ({
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
    successMessage: null,
    setTargetName: vi.fn(),
    setTimezone: vi.fn(),
    setDefaultCalendarId: vi.fn(),
    setReminderEnabled: vi.fn(),
    setReminderMinutesBefore: vi.fn(),
    submit: submitMock,
  }),
}));

describe('OnboardingPage', () => {
  it('renders the onboarding heading and profile form', () => {
    submitMock.mockResolvedValue(false);
    render(<OnboardingPage />);

    expect(screen.getByRole('heading', { name: /complete your profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save and continue/i })).toBeInTheDocument();
  });

  it('navigates to capture after a successful submit', async () => {
    submitMock.mockResolvedValue(true);
    render(<OnboardingPage />);

    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/capture', { replace: true });
    });
  });
});
