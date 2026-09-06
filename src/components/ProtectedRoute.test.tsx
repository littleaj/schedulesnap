import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import type { User } from 'firebase/auth';

const { authMock, onAuthStateChangedMock } = vi.hoisted(() => ({
  authMock: { currentUser: null as Partial<User> | null },
  onAuthStateChangedMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
}));

vi.mock('../hooks/firebase', () => ({
  useAuth: () => authMock,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    onAuthStateChangedMock.mockReset();
  });

  it('renders the nested route for authenticated users', async () => {
    authMock.currentUser = { uid: 'user-123' };
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

  it('redirects unauthenticated users to the login page', async () => {
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
