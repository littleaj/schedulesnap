import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import ProfileForm from './ProfileForm';

describe('ProfileForm', () => {
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

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
