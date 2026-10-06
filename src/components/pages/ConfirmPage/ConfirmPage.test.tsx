import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMessageProvider } from '@/contexts/user-message';
import ConfirmPage from './ConfirmPage';

const { loadAnalysisResponseMock, loadDraftConfirmationMock, saveDraftConfirmationMock, getUserProfileMock, useCurrentUserMock, useFirestoreMock, navigateMock } = vi.hoisted(() => ({
  loadAnalysisResponseMock: vi.fn(),
  loadDraftConfirmationMock: vi.fn(),
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
  saveDraftConfirmation: saveDraftConfirmationMock,
}));

vi.mock('@/services/user-profile', () => ({
  getUserProfile: getUserProfileMock,
}));

describe('ConfirmPage', () => {
  const renderConfirmPage = () => render(
    <UserMessageProvider>
      <MemoryRouter>
        <ConfirmPage />
      </MemoryRouter>
    </UserMessageProvider>,
  );

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

  afterEach(() => {
    vi.useRealTimers();
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

    renderConfirmPage();

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

    renderConfirmPage();

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

  it('forwards to creating page when create events is clicked', async () => {
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

    renderConfirmPage();

    fireEvent.click(screen.getByRole('button', { name: /create events/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/creating', expect.objectContaining({
        replace: true,
        state: expect.objectContaining({ create: true, createRunId: expect.any(String) }),
      }));
    });
  });

  it('falls back to capture when no cached review exists', () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue(null);

    renderConfirmPage();

    expect(screen.getByText(/no saved review was found/i)).toBeInTheDocument();
  });

  it('shows an undo toast and delays draft persistence when removing a shift', () => {
    vi.useFakeTimers();
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

    renderConfirmPage();

    fireEvent.click(screen.getByRole('button', { name: /remove shift/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Shift removed');
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(saveDraftConfirmationMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
      shifts: expect.not.arrayContaining([expect.objectContaining({ role: 'Barista', startTime: '09:00', endTime: '17:00' })]),
    }));
  });

  it('shows a new undo toast after a previous removal is undone and re-removed', () => {
    vi.useFakeTimers();
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

    renderConfirmPage();

    fireEvent.click(screen.getByRole('button', { name: /remove shift/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Shift removed');

    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Barista')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /remove shift/i })[0]);
    expect(screen.getByRole('status')).toHaveTextContent('Shift removed');
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('restores a removed shift when undo is clicked before the toast timeout', () => {
    vi.useFakeTimers();
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

    renderConfirmPage();

    fireEvent.click(screen.getByRole('button', { name: /remove shift/i }));
    fireEvent.click(screen.getByRole('button', { name: /undo/i }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(saveDraftConfirmationMock).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Barista')).toBeInTheDocument();
  });

  it('removes only the selected shift when a day has multiple shifts', () => {
    vi.useFakeTimers();
    loadDraftConfirmationMock.mockReturnValue({
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '12:00',
          role: 'Barista',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 12:00 PM',
        },
        {
          date: '2026-09-05',
          startTime: '13:00',
          endTime: '17:00',
          role: 'Cashier',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 1:00 PM - 5:00 PM',
        },
      ],
      selectedCalendarId: 'primary',
    });
    loadAnalysisResponseMock.mockReturnValue(null);

    renderConfirmPage();

    fireEvent.click(screen.getAllByRole('button', { name: /remove shift/i })[0]);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
      shifts: expect.arrayContaining([expect.objectContaining({ role: 'Cashier', startTime: '13:00', endTime: '17:00' })]),
    }));
    expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
      shifts: expect.not.arrayContaining([expect.objectContaining({ role: 'Barista', startTime: '09:00', endTime: '12:00' })]),
    }));
  });

  it('shows the day-off empty state when removing the only shift on a day', () => {
    vi.useFakeTimers();
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

    renderConfirmPage();
    expect(screen.getAllByRole('button', { name: /remove shift/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /remove shift/i }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole('button', { name: /remove shift/i })).not.toBeInTheDocument();
  });
});
