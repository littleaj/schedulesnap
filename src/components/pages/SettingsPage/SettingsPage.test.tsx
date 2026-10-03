import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import SettingsPage from './SettingsPage';
import type { ProfileFormProps } from '@/components/organisms/ProfileForm';

vi.mock('@/components/organisms/ProfileForm', () => ({
  default: (props: ProfileFormProps) => {
    return (
      <>
        <header>
          <h1>{props.heading}</h1>
          <p data-testid="profile-subheading">{props.subheading}</p>
        </header>
        <p>Profile saved</p>
        <button onClick={() => props.onSubmit?.()}>{props.submitLabel}</button>
      </>
    );
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [{ id: 'primary', summary: 'Primary' }] }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderPage = () => render(
    <GoogleOAuthTokenContext.Provider value={{ getToken: () => 'fake-token', setToken: vi.fn(), getTokenExpiresAt: vi.fn(), setTokenExpiresAt: vi.fn() }}>
      <SettingsPage />
    </GoogleOAuthTokenContext.Provider>
  );

  it('renders settings heading and save action', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-subheading')).toHaveTextContent(/./);
    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
  });
});
