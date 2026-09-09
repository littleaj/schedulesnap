import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import AnalysisPage from './AnalysisPage';

const {
  analyzeSchedulePhotoMock,
  getUserProfileMock,
  loadCapturedSchedulePhotoMock,
  navigateMock,
  useAuthMock,
  useFirestoreMock,
} = vi.hoisted(() => ({
  analyzeSchedulePhotoMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  loadCapturedSchedulePhotoMock: vi.fn(),
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
  useFirestoreMock: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/firebase', () => ({
  useAuth: () => useAuthMock(),
  useFirestore: () => useFirestoreMock(),
}));

vi.mock('@/services/user-profile', () => ({
  getUserProfile: getUserProfileMock,
}));

vi.mock('@/services/schedule-analysis', () => ({
  analyzeSchedulePhoto: analyzeSchedulePhotoMock,
  loadCapturedSchedulePhoto: loadCapturedSchedulePhotoMock,
}));

describe('AnalysisPage', () => {
  it('renders the loading state and kicks off analysis from cached capture data', async () => {
    useAuthMock.mockReturnValue({ currentUser: { uid: 'user-123', displayName: 'Alex' } });
    useFirestoreMock.mockReturnValue({});
    loadCapturedSchedulePhotoMock.mockReturnValue({
      base64: 'resized-base64',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
      savedAt: '2026-09-09T00:00:00.000Z',
    });
    getUserProfileMock.mockResolvedValue({
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: {
        enabled: false,
        minutesBefore: 30,
      },
    });
    analyzeSchedulePhotoMock.mockResolvedValue({ warnings: [], shifts: [] });

    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /analyzing your schedule/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(analyzeSchedulePhotoMock).toHaveBeenCalledWith(
        {
          base64: 'resized-base64',
          mimeType: 'image/jpeg',
          fileName: 'schedule.jpg',
          savedAt: '2026-09-09T00:00:00.000Z',
        },
        'Alex',
      );
      expect(navigateMock).toHaveBeenCalledWith('/confirm', { replace: true });
    });
  });

  it('shows a back button when no cached capture exists', async () => {
    useAuthMock.mockReturnValue({ currentUser: { uid: 'user-123', displayName: 'Alex' } });
    useFirestoreMock.mockReturnValue({});
    loadCapturedSchedulePhotoMock.mockReturnValue(null);

    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/no captured photo was found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to capture/i })).toBeInTheDocument();
    });
  });

  it('shows an error icon when analysis fails', async () => {
    useAuthMock.mockReturnValue({ currentUser: { uid: 'user-123', displayName: 'Alex' } });
    useFirestoreMock.mockReturnValue({});
    loadCapturedSchedulePhotoMock.mockReturnValue({
      base64: 'resized-base64',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
      savedAt: '2026-09-09T00:00:00.000Z',
    });
    getUserProfileMock.mockResolvedValue({
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: {
        enabled: false,
        minutesBefore: 30,
      },
    });
    analyzeSchedulePhotoMock.mockRejectedValue(new Error('boom'));

    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong reading your photo/i);
      expect(document.querySelector('.analysis-card__icon--error')).toBeTruthy();
    });
  });
});
