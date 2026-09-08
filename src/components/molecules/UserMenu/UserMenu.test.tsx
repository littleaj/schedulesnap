import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import UserMenu from './UserMenu';

describe('UserMenu', () => {
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
});
