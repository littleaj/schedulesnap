import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HeaderBar from './HeaderBar';

const { currentUserMock } = vi.hoisted(() => ({
  currentUserMock: vi.fn(),
}));

vi.mock('@/hooks/current-user', () => ({
  default: () => currentUserMock(),
}));

describe('HeaderBar', () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    currentUserMock.mockReturnValue(null);
  });

  it('shows the logo, primary action, help link, and logged-out menu state', async () => {

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
    expect(screen.getByRole('menuitem', { name: /^login$/i })).toBeEnabled();
  });

  it('shows the logged-in avatar and enables the settings link', async () => {
    currentUserMock.mockReturnValue({
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.png',
      uid: 'user-123',
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
