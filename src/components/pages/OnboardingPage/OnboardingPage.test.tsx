import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import OnboardingPage from './OnboardingPage';
import type { ProfileFormProps } from '@/components/organisms/ProfileForm';

const { navigateMock, submitMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  submitMock: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/components/organisms/ProfileForm', () => ({
  default: (props: ProfileFormProps) => {
    return (
      <>
        <header>
          <h1>{props.heading}</h1>
          <p data-testid="profile-subheading">{props.subheading}</p>
        </header>
        <button onClick={() => props.onSubmit?.()}>{props.submitLabel}</button>
      </>
    );
  },
}));

describe('OnboardingPage', () => {
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
      <OnboardingPage />
    </GoogleOAuthTokenContext.Provider>
  );

  it('renders the onboarding heading and profile form', async () => {
    submitMock.mockResolvedValue(false);
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /complete your profile/i })).toBeInTheDocument();
    });
    expect(screen.getByTestId('profile-subheading')).toHaveTextContent(/./);
    expect(screen.getByRole('button', { name: /save and continue/i })).toBeInTheDocument();
  });

  it('navigates to capture after a successful submit', async () => {
    submitMock.mockResolvedValue(true);
    renderPage();

    const continueButton = screen.getByRole('button', { name: /save and continue/i });
    await waitFor(() => {
      expect(continueButton).toBeInTheDocument();
    });

    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/capture', { replace: true });
    });
  });
});
