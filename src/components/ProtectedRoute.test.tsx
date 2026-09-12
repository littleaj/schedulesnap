import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import type { User } from 'firebase/auth';

const { authMock, firestoreMock, onAuthStateChangedMock, getUserProfileMock, currentUserMock } = vi.hoisted(() => ({
  authMock: { currentUser: null as Partial<User> | null },
  firestoreMock: {},
  onAuthStateChangedMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  currentUserMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
}));

vi.mock('../hooks/firebase', () => ({
  useAuth: () => authMock,
  useFirestore: () => firestoreMock,
}));

vi.mock('@/hooks/current-user', () => ({
  default: () => currentUserMock(),
}));

vi.mock('@/services/user-profile', () => ({
  getUserProfile: getUserProfileMock,
  isUserProfileComplete: (profile: unknown) => Boolean(profile),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    currentUserMock.mockReset();
    onAuthStateChangedMock.mockReset();
    getUserProfileMock.mockReset();
  });

  it('renders the nested route for authenticated users', async () => {
    currentUserMock.mockReturnValue({ uid: 'user-123' });
    getUserProfileMock.mockResolvedValue({
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: { enabled: true, minutesBefore: 60 },
    });

    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback({ uid: 'user-123' });
      return () => undefined;
    });

    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/capture" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
  });

  it('renders protected routes for authenticated users even without a profile', async () => {
    currentUserMock.mockReturnValue({ uid: 'user-123' });
    getUserProfileMock.mockResolvedValue(null);

    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback({ uid: 'user-123' });
      return () => undefined;
    });

    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/capture" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
  });

  it('allows access to settings even when onboarding is incomplete', async () => {
    currentUserMock.mockReturnValue({ uid: 'user-123' });
    getUserProfileMock.mockResolvedValue(null);

    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback({ uid: 'user-123' });
      return () => undefined;
    });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/settings" element={<div>Settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings page')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users to the login page', async () => {
    currentUserMock.mockReturnValue(null);
    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback(null);
      return () => undefined;
    });

    const LoginPage = () => {
      const location = useLocation();
      return <div>{`Login page ${location.state?.from?.pathname ?? 'unknown'}`}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/capture" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Login page/i)).toBeInTheDocument();
    });
  });
});
