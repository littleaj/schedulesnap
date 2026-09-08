import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';

const { signInWithPopupMock, navigateMock, getUserProfileMock } = vi.hoisted(() => ({
  signInWithPopupMock: vi.fn(),
  navigateMock: vi.fn(),
  getUserProfileMock: vi.fn(),
}));

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth');

  return {
    ...actual,
    GoogleAuthProvider: class {
      scopes: string[] = [];
      addScope(scope: string) {
        this.scopes.push(scope);
        return this;
      }
    },
    signInWithPopup: signInWithPopupMock,
  };
});

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../hooks/firebase', () => ({
  useAuth: () => ({ uid: 'test-user' }),
  useFirestore: () => ({ mocked: true }),
}));

vi.mock('@/services/userProfileService', () => ({
  getUserProfile: getUserProfileMock,
  isUserProfileComplete: (profile: unknown) => Boolean(profile),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithPopupMock.mockReset();
    navigateMock.mockReset();
    getUserProfileMock.mockReset();
  });

  it('shows the Google sign in prompt and permission explanation', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in to schedule ?snap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getAllByText(/schedule.?snap needs access to your google calendar/i).length).toBeGreaterThan(0);
  });

  it('requests Google Calendar access when the sign-in button is clicked', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
    });

    const provider = signInWithPopupMock.mock.calls[0][1];
    expect(provider.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
  });

  it('redirects first-time users to onboarding and returning users to capture', async () => {
    signInWithPopupMock.mockResolvedValue({ user: { displayName: 'Test User', uid: 'user-123' } });
    getUserProfileMock.mockResolvedValueOnce(null);

    const { rerender } = render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/onboarding', { replace: true });
    });

    getUserProfileMock.mockResolvedValueOnce({
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: {
        enabled: true,
        minutesBefore: 60,
      },
    });

    rerender(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenLastCalledWith('/capture', { replace: true });
    });
  });
});
