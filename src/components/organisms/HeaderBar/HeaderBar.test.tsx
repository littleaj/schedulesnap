import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HeaderBar from './HeaderBar';

const { authMock, onAuthStateChangedMock } = vi.hoisted(() => ({
  authMock: { currentUser: null as Partial<User> | null },
  onAuthStateChangedMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
}));

vi.mock('../../../hooks/firebase', () => ({
  useAuth: () => authMock,
}));

describe('HeaderBar', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    onAuthStateChangedMock.mockReset();
  });

  it('shows the logo, primary action, help link, and logged-out menu state', async () => {
    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback(null);
      return () => undefined;
    });

    render(
      <MemoryRouter>
        <HeaderBar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /schedulesnap/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /snap schedule/i })).toHaveAttribute('href', '/capture');
    expect(screen.getByRole('link', { name: /help/i })).toHaveAttribute('href', '/help');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }));

    expect(screen.getByRole('button', { name: /^settings$/i })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: /^login$/i })).toHaveAttribute('href', '/login');
  });

  it('shows the logged-in avatar and enables the settings link', async () => {
    authMock.currentUser = {
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.png',
      uid: 'user-123',
    };

    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback(authMock.currentUser as User);
      return () => undefined;
    });

    render(
      <MemoryRouter>
        <HeaderBar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }));

    expect(screen.getByRole('menuitem', { name: /^settings$/i })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('menuitem', { name: /^logout$/i })).toHaveAttribute('href', '/logout');
    expect(screen.getByAltText(/test user avatar/i)).toHaveAttribute('src', 'https://example.com/avatar.png');
  });
});
