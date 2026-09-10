import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserMenu from './UserMenu';

const { signInWithRedirectMock, navigateMock, getUserProfileMock } = vi.hoisted(() => ({
  signInWithRedirectMock: vi.fn(),
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
    signInWithRedirect: signInWithRedirectMock,
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

vi.mock('@/services/user-profile', () => ({
  getUserProfile: getUserProfileMock,
  isUserProfileComplete: (profile: unknown) => Boolean(profile),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    signInWithRedirectMock.mockReset();
    navigateMock.mockReset();
    getUserProfileMock.mockReset();
  });

  it('closes when a menu item is clicked or when the user clicks outside the menu', async () => {
    render(
      <MemoryRouter>
        <UserMenu user={{ displayName: 'Test User', photoURL: null } as never} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }));
    expect(screen.getByRole('menu', { name: /account options/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /logout/i }));
    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: /account options/i })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }));
    expect(screen.getByRole('menu', { name: /account options/i })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: /account options/i })).not.toBeInTheDocument();
    });
  });

  it('runs Google login directly when logged-out LOGIN is clicked', async () => {
    signInWithRedirectMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <UserMenu user={null} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^login$/i }));

    await waitFor(() => {
      expect(signInWithRedirectMock).toHaveBeenCalledTimes(1);
    });

    const provider = signInWithRedirectMock.mock.calls[0][1];
    expect(provider.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
  });
});
