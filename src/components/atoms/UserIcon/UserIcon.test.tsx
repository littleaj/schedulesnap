import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UserIcon from './UserIcon';

describe('UserIcon', () => {
  it('logs and falls back to the filled icon when the avatar image fails to load', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { container } = render(<UserIcon loggedIn displayName="Test User" photoURL="https://example.com/avatar.png" />);

    const avatar = screen.getByAltText('Test User avatar');
    fireEvent.error(avatar);

    expect(errorSpy).toHaveBeenCalled();
    expect(screen.queryByAltText('Test User avatar')).not.toBeInTheDocument();
    expect(container.querySelector('img.user-icon__image')).toHaveAttribute('src', '/assets/user-icon-filled.svg');

    errorSpy.mockRestore();
  });
});
