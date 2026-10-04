import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CapturePage from './CapturePage';

const {
  resizeSchedulePhotoMock,
  saveCapturedSchedulePhotoMock,
  navigateMock,
  getUserProfileMock,
  isUserProfileCompleteMock,
  currentUserMock,
} = vi.hoisted(() => ({
  resizeSchedulePhotoMock: vi.fn(),
  saveCapturedSchedulePhotoMock: vi.fn(),
  navigateMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  isUserProfileCompleteMock: vi.fn(),
  currentUserMock: vi.fn(),
}));

const fakeUid = "fake-uid-capture-page";
vi.mock('@/hooks/current-user', () => ({
  default: () => currentUserMock(),
}));

vi.mock('@/hooks/firebase', () => ({
  useFirestore: () => ({}),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/services/schedule-analysis', () => ({
  resizeSchedulePhoto: resizeSchedulePhotoMock,
  saveCapturedSchedulePhoto: saveCapturedSchedulePhotoMock,
}));

vi.mock('@/services/user-profile', () => ({
  getUserProfile: getUserProfileMock,
  isUserProfileComplete: isUserProfileCompleteMock,
}));

describe('CapturePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    resizeSchedulePhotoMock.mockReset();
    saveCapturedSchedulePhotoMock.mockReset();
    getUserProfileMock.mockReset();
    isUserProfileCompleteMock.mockReset();
    currentUserMock.mockReset();
    currentUserMock.mockReturnValue({ uid: fakeUid });

    getUserProfileMock.mockResolvedValue({
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: { enabled: true, minutesBefore: 30 },
    });
    isUserProfileCompleteMock.mockReturnValue(true);
  });

  it('redirects to onboarding when the user profile is incomplete', async () => {
    getUserProfileMock.mockResolvedValue(null);
    isUserProfileCompleteMock.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/onboarding" element={<div>Onboarding page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/onboarding',
        expect.objectContaining({
          replace: true,
          state: expect.objectContaining({
            from: expect.objectContaining({ pathname: '/capture' }),
          }),
        })
      );
    });
  });

  it('renders the upload instructions and file input', async () => {
    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route path="/capture" element={<CapturePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /upload .*/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/choose a picture/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Image/i })).toBeInTheDocument();
  });

  it('resizes and caches the selected file before enabling review', async () => {
    resizeSchedulePhotoMock.mockResolvedValue({
      base64: 'resized-base64',
      mimeType: 'image/jpeg',
      fileName: 'schedule.png',
    });

    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route path="/capture" element={<CapturePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /upload .*/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Analyze Image/i })).not.toBeEnabled();

    const input = screen.getByLabelText(/choose a picture/i) as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(['test'], 'schedule.png', { type: 'image/png' })],
      },
    });

    await waitFor(() => {
      expect(resizeSchedulePhotoMock).toHaveBeenCalledTimes(1);
      expect(saveCapturedSchedulePhotoMock).toHaveBeenCalledWith(fakeUid, {
        base64: 'resized-base64',
        mimeType: 'image/jpeg',
        fileName: 'schedule.png',
      });
    });

    expect(screen.getByRole('button', { name: /Analyze Image/i })).toBeEnabled();
  });

  it('navigates to analysis after a photo is prepared', async () => {
    resizeSchedulePhotoMock.mockResolvedValue({
      base64: 'resized-base64',
      mimeType: 'image/jpeg',
      fileName: 'schedule.png',
    });

    render(
      <MemoryRouter initialEntries={['/capture']}>
        <Routes>
          <Route path="/capture" element={<CapturePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /upload.*/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/choose a picture/i), {
      target: {
        files: [new File(['test'], 'schedule.png', { type: 'image/png' })],
      },
    });

    const analyzeButton = screen.getByRole('button');
    await waitFor(() => {
      expect(analyzeButton).toBeEnabled();
    });

    fireEvent.click(analyzeButton);

    expect(navigateMock).toHaveBeenCalledWith(
      '/analyze',
      expect.objectContaining({
        state: expect.objectContaining({
          from: expect.objectContaining({ pathname: '/capture' }),
        }),
      }),
    );
  });
});
