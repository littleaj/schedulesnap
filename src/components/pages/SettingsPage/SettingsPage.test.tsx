import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import SettingsPage from './SettingsPage';

const { submitMock } = vi.hoisted(() => ({
  submitMock: vi.fn(),
}));

vi.mock('@/components/organisms/ProfileForm', () => ({
  default: (props: any) => {
    return (
      <div>
        <p>Profile saved</p>
        <button onClick={() => props.onSubmit?.()}>{props.submitLabel}</button>
      </div>
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
    expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
  });

  it('shows save feedback and triggers save when submitted', async () => {
    submitMock.mockResolvedValue(true);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/profile saved/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledTimes(1);
    });
  });
});
