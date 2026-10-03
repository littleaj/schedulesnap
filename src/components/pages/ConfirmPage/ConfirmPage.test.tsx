import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmPage from './ConfirmPage';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';

const { loadAnalysisResponseMock, loadDraftConfirmationMock, loadCapturedSchedulePhotoMock, saveDraftConfirmationMock, getUserProfileMock, useCurrentUserMock, useFirestoreMock, navigateMock } = vi.hoisted(() => ({
  loadAnalysisResponseMock: vi.fn(),
  loadDraftConfirmationMock: vi.fn(),
  loadCapturedSchedulePhotoMock: vi.fn(),
  saveDraftConfirmationMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  useFirestoreMock: vi.fn(),
  navigateMock: vi.fn(),
}));

const fakeUid = "fake-uid-confirm-page";
vi.mock('@/hooks/firebase', () => ({
  useAuth: () => ({
    currentUser: { uid: fakeUid },
  }),
  useFirestore: () => useFirestoreMock(),
}));

vi.mock('@/hooks/current-user', () => ({
  default: () => useCurrentUserMock(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/services/schedule-analysis', () => ({
  clearAnalysisFlowCache: vi.fn(),
  loadAnalysisResponse: loadAnalysisResponseMock,
  loadDraftConfirmation: loadDraftConfirmationMock,
  loadCapturedSchedulePhoto: loadCapturedSchedulePhotoMock,
  saveDraftConfirmation: saveDraftConfirmationMock,
}));

vi.mock('@/services/user-profile', () => ({
  getUserProfile: getUserProfileMock,
}));

describe('ConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    getUserProfileMock.mockResolvedValue({
      targetName: 'Alex',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      reminder: {
        enabled: false,
        minutesBefore: 30,
      },
    });
    useCurrentUserMock.mockReturnValue({ uid: fakeUid, displayName: 'Alex' });
    useFirestoreMock.mockReturnValue({});
  });

  it.todo('renders the cached analysis response when resuming a review', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          role: 'Barista',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /review your shifts/i })).toBeInTheDocument();
    expect(screen.getByText(/1 shift/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /scanned weekly schedule/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText(new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date('2026-09-05T00:00:00')))).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /start time/i }).some((button) => button.textContent !== 'Start time')).toBe(true);
    expect(screen.getAllByRole('button', { name: /end time/i }).some((button) => button.textContent !== 'End time')).toBe(true);
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Downtown')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Start time')).toHaveLength(6);
    expect(screen.getAllByPlaceholderText('End time')).toHaveLength(6);
    expect(screen.getAllByPlaceholderText('Event name')).toHaveLength(6);
    expect(screen.getAllByPlaceholderText('Location')).toHaveLength(6);
  });

  it('renders the captured schedule photo preview when available', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          role: 'Barista',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    });
    loadCapturedSchedulePhotoMock.mockReturnValue({
      base64: 'ZmFrZS1pbWFnZS1kYXRh',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });

    render(
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>,
    );

    const image = screen.getByRole('img', { name: /captured schedule/i });
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh');
    expect(image).toHaveAttribute('alt', 'Captured schedule');
  });

  it.todo('saves edited values to the draft when a shift is updated', async () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          role: 'Barista',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>,
    );

    const input = screen.getByDisplayValue('09:00 AM');
    fireEvent.change(input, { target: { value: '10:30 AM' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
        shifts: expect.arrayContaining([
          expect.objectContaining({ date: '2026-09-05', startTime: '10:30' }),
        ]),
      }));
    });
  });

  it('redirects to the finished page after creating Google Calendar events', async () => {
    loadDraftConfirmationMock.mockReturnValue({
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          role: 'Barista',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
      selectedCalendarId: 'primary',
    });
    loadAnalysisResponseMock.mockReturnValue(null);

    const getToken = vi.fn(() => 'google-access-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: vi.fn().mockResolvedValue('ok'),
    }));

    render(
      <GoogleOAuthTokenContext.Provider value={{ getToken, setToken: vi.fn(), getTokenExpiresAt: vi.fn(), setTokenExpiresAt: vi.fn() }}>
        <MemoryRouter>
          <ConfirmPage />
        </MemoryRouter>
      </GoogleOAuthTokenContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /create events/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer google-access-token',
          }),
        }),
      );
      expect(navigateMock).toHaveBeenCalledWith('/finished', expect.anything());
    });
  });

  it('falls back to capture when no cached review exists', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue(null);

    render(
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no saved review was found/i)).toBeInTheDocument();
  });
});
