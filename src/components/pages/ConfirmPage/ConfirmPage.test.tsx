import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmPage from './ConfirmPage';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';

const { loadAnalysisResponseMock, loadDraftConfirmationMock, saveDraftConfirmationMock, useGoogleCalendarTokenMock, navigateMock } = vi.hoisted(() => ({
  loadAnalysisResponseMock: vi.fn(),
  loadDraftConfirmationMock: vi.fn(),
  saveDraftConfirmationMock: vi.fn(),
  useGoogleCalendarTokenMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/services/schedule-analysis', () => ({
  loadAnalysisResponse: loadAnalysisResponseMock,
  loadDraftConfirmation: loadDraftConfirmationMock,
  saveDraftConfirmation: saveDraftConfirmationMock,
}));

vi.mock('@/hooks/useGoogleCalendarToken', () => ({
  useGoogleCalendarToken: useGoogleCalendarTokenMock,
}));

describe('ConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    useGoogleCalendarTokenMock.mockReturnValue({
      getAccessToken: vi.fn().mockResolvedValue('google-access-token'),
      clearToken: vi.fn(),
      isAuthorizing: false,
      authError: null,
    });
  });

  it('renders the cached analysis response when resuming a review', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
      warnings: ['Year assumed from context'],
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

    expect(screen.getByRole('heading', { name: /review your extracted shifts/i })).toBeInTheDocument();
    expect(screen.getByText(/1 extracted shift/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /weekly schedule/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText(new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date('2026-09-05T00:00:00')))).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /start time/i }).some((button) => button.textContent !== 'Start time')).toBe(true);
    expect(screen.getAllByRole('button', { name: /end time/i }).some((button) => button.textContent !== 'End time')).toBe(true);
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Downtown')).toBeInTheDocument();
    expect(screen.getAllByText('Start time')).toHaveLength(6);
    expect(screen.getAllByText('End time')).toHaveLength(6);
    expect(screen.getAllByText('Role')).toHaveLength(6);
    expect(screen.getAllByText('Location')).toHaveLength(6);
  });

  it('saves edited values to the draft when a shift is updated', async () => {
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

    const startTimeButton = screen.getAllByRole('button', { name: /start time/i }).find((button) => button.textContent !== 'Start time');
    expect(startTimeButton).toBeTruthy();

    fireEvent.doubleClick(startTimeButton!);
    const input = screen.getByDisplayValue('9:00 AM');
    fireEvent.change(input, { target: { value: '10:30 AM' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(saveDraftConfirmationMock).toHaveBeenCalledWith(expect.objectContaining({
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
      <GoogleOAuthTokenContext.Provider value={{ getToken, setToken: vi.fn() }}>
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
      expect(navigateMock).toHaveBeenCalledWith('/finished', { replace: true });
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
