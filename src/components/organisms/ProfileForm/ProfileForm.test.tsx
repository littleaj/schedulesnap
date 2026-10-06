import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import ProfileForm from './ProfileForm';

const { getUserProfileMock, saveUserProfileMock, useCurrentUserMock, useFirestoreMock } = vi.hoisted(() => ({
  getUserProfileMock: vi.fn(),
  saveUserProfileMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  useFirestoreMock: vi.fn(),
}));

vi.mock('@/hooks/firebase', () => ({
  useAuth: () => ({ currentUser: { uid: 'fake-user-id' } }),
  useFirestore: () => useFirestoreMock(),
  useAnalytics: () => undefined,
}));

vi.mock('@/hooks/current-user', () => ({
  default: () => useCurrentUserMock(),
}));

vi.mock('@/services/user-profile', () => ({
  buildDefaultUserProfile: (timezone = 'UTC', displayName: string | null = null, calendarId = 'primary') => ({
    targetName: typeof displayName === 'string' ? (displayName.split(' ')[0] ?? '') : '',
    timezone,
    defaultCalendarId: calendarId,
    defaultShiftName: 'Work',
    namePrefix: '',
    reminder: {
      enabled: false,
      minutesBefore: 30,
    },
  }),
  getUserProfile: getUserProfileMock,
  saveUserProfile: saveUserProfileMock,
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [{ id: 'primary', summary: 'Primary' }] }),
      }),
    );
    useCurrentUserMock.mockReturnValue({ uid: 'fake-user-id', displayName: 'Taylor' });
    useFirestoreMock.mockReturnValue({});
    getUserProfileMock.mockResolvedValue(null);
    saveUserProfileMock.mockImplementation(async (_firestore, _uid, profile) => profile);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderForm = (props: Partial<React.ComponentProps<typeof ProfileForm>> = {}) => render(
    <GoogleOAuthTokenContext.Provider value={{ getToken: () => 'fake-token', setToken: vi.fn(), getTokenExpiresAt: vi.fn(), setTokenExpiresAt: vi.fn() }}>
      <ProfileForm
        heading="Profile setup"
        subheading="Tell us about your schedule preferences"
        submitLabel="Save profile"
        onSubmit={() => undefined}
        {...props}
      />
    </GoogleOAuthTokenContext.Provider>
  );

  it('renders all profile fields and submit label', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /profile setup/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/name on schedule/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/default calendar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/default shift name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name prefix/i)).toBeInTheDocument();
    // expect(screen.getByLabelText(/enable reminders/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
  });

  it('calls field handlers and submit handler when user interacts', async () => {
    const onSubmit = vi.fn();

    renderForm({
      onSubmit,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/name on schedule/i), { target: { value: 'Taylor' } });
    fireEvent.change(screen.getByLabelText(/timezone/i), { target: { value: 'America/Chicago' } });
    fireEvent.change(screen.getByLabelText(/default calendar/i), { target: { value: 'primary' } });
    fireEvent.change(screen.getByLabelText(/default shift name/i), { target: { value: 'Work Shift' } });
    fireEvent.change(screen.getByLabelText(/name prefix/i), { target: { value: 'Retail - ' } });

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(saveUserProfileMock).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
