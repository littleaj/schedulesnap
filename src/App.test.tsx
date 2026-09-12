import { fireEvent, render, screen } from '@testing-library/react';
import { Outlet } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

const { currentUserMock } = vi.hoisted(() => ({
  currentUserMock: vi.fn(),
}));

vi.mock('@/hooks/current-user', () => ({
  default: () => currentUserMock(),
}));

vi.mock('@/components/ProtectedRoute', () => ({
  default: () => <Outlet />,
}));

vi.mock('@/components/organisms/HeaderBar', () => ({
  default: () => <div data-testid="header-bar" />,
}));

vi.mock('@/components/pages/HomePage', () => ({
  default: () => <div>Home page</div>,
}));

vi.mock('@/components/pages/LoginPage', () => ({
  default: () => <div>Login page</div>,
}));

vi.mock('@/components/pages/LogoutPage', () => ({
  default: () => <div>Logout page</div>,
}));

vi.mock('@/components/pages/OnboardingPage', () => ({
  default: () => <div>Onboarding page</div>,
}));

vi.mock('@/components/pages/CapturePage', () => ({
  default: () => <div>Capture page</div>,
}));

vi.mock('@/components/pages/AnalysisPage', () => ({
  default: () => <div>Analysis page</div>,
}));

vi.mock('@/components/pages/ConfirmPage', () => ({
  default: () => <div>Confirm page</div>,
}));

vi.mock('@/components/pages/SettingsPage', () => ({
  default: () => <div>Settings page</div>,
}));

vi.mock('@/services/analysis-flow', () => ({
  getAnalysisFlowResumeTarget: () => ({
    route: '/confirm',
    description: 'an in-progress review',
  }),
}));

describe('App', () => {
  it('shows the resume dialog above the current page and continues to the cached route', () => {
    window.history.pushState({}, '', '/settings');
    currentUserMock.mockReturnValue({ uid: 'user-123', displayName: 'Alex' });

    render(<App />);

    expect(screen.getByText(/continue where you left off/i)).toBeInTheDocument();
    expect(screen.getByText(/we found an in-progress review/i)).toBeInTheDocument();
    expect(screen.getByText(/settings page/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/^continue$/i));

    expect(window.location.pathname).toBe('/confirm');
  });
});
