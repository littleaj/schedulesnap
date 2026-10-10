import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMessageProvider } from '@/contexts/user-message';
import ConfirmPage from './ConfirmPage';
import { buildWeekDays } from './utils/weekdays';

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

vi.mock('@/utils/shift-name', () => ({
  resolveShiftName: (profile: { defaultShiftName?: string; namePrefix?: string }, extractedName?: string | null) => {
    const prefix = profile.namePrefix ?? '';
    const trimmedName = extractedName?.trim() ?? '';
    const withoutPrefix = prefix && trimmedName.startsWith(prefix)
      ? trimmedName.slice(prefix.length)
      : trimmedName;
    const baseName = withoutPrefix || profile.defaultShiftName?.trim() || 'Work';
    return `${prefix}${baseName}`;
  },
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
      defaultShiftName: 'Work Shift',
      namePrefix: 'Retail - ',
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

  it('renders shifts as read-only text blocks by default', () => {
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
    expect(screen.getByLabelText(/scanned weekly schedule/i)).toBeInTheDocument();
    expect(screen.getByText(new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date('2026-09-05T00:00:00')))).toBeInTheDocument();
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/5:00 PM/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /event name/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /start time/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /end time/i })).not.toBeInTheDocument();
  });

  it('opens the edit dialog and saves values only when OK is clicked', async () => {
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
    saveDraftConfirmationMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /edit shift barista on .* from 09:00 to 17:00/i }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /event name/i })).toHaveValue('Barista');
    expect(screen.getByLabelText(/start time/i)).toHaveValue('09:00');
    expect(screen.getByLabelText(/end time/i)).toHaveValue('17:00');

    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '10:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
        shifts: expect.arrayContaining([
          expect.objectContaining({ date: '2026-09-05', startTime: '10:30' }),
        ]),
      }));
    });
  });

  it('discards edit dialog changes when Cancel is clicked', async () => {
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
    saveDraftConfirmationMock.mockClear();

    fireEvent.doubleClick(screen.getByText(/9:00/i));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '11:15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();
    expect(saveDraftConfirmationMock).not.toHaveBeenCalled();
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

  it('renders a persistent AI review disclaimer above the weekly schedule', () => {
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

    const disclaimer = screen.getByText(/Schedules are extracted by AI and can contain mistakes/i);
    const grid = document.getElementById('confirm-card__grid');

    expect(disclaimer).toBeInTheDocument();
    expect(grid).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close|dismiss/i })).not.toBeInTheDocument();
    expect(grid).not.toBeNull();
    expect(disclaimer.compareDocumentPosition(grid as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('prepends the name prefix and falls back to the default shift name when no AI name is extracted', async () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
        {
          date: '2026-09-05',
          startTime: '12:00',
          endTime: '21:00',
          role: 'Barista',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 5 12:00 PM - 9:00 PM',
        },
      ],
    });

    renderConfirmPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Retail - Work Shift')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Retail - Barista')).toBeInTheDocument();
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
    expect(screen.getByText('Barista')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /remove shift/i })[0]);
    expect(screen.getByRole('status')).toHaveTextContent('Shift removed');
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('persists a removed shift only once in strict mode after undo timeout', () => {
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

    render(
      <StrictMode>
        <UserMessageProvider>
          <MemoryRouter>
            <ConfirmPage />
          </MemoryRouter>
        </UserMessageProvider>
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole('button', { name: /remove shift/i }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(saveDraftConfirmationMock).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText('Barista')).toBeInTheDocument();
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

    expect(
      screen.getByRole('button', { name: /remove shift barista on .* from 09:00 to 12:00/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove shift cashier on .* from 13:00 to 17:00/i }),
    ).toBeInTheDocument();

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

  it('renders add shift button on each day cell', () => {
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

    // Should have 7 add buttons (one per day of the week)
    const addButtons = screen.getAllByRole('button', { name: /add shift to/i });
    expect(addButtons).toHaveLength(7);
  });

  it('opens edit dialog when add shift button is clicked', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /sat/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /event name/i })).toHaveValue('');
    expect(screen.getByLabelText(/start time/i)).toHaveValue('');
    expect(screen.getByLabelText(/end time/i)).toHaveValue('');
  });

  it('requires event name, start time, and end time before saving a new shift', async () => {
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
    saveDraftConfirmationMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.getByText(/enter a name and a valid time range/i)).toBeInTheDocument();
    });
    expect(saveDraftConfirmationMock).not.toHaveBeenCalled();
  });

  it('requires the start time to be before the end time before saving a new shift', async () => {
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
    saveDraftConfirmationMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /event name/i }), { target: { value: 'Cashier' } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '17:00' } });
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '13:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.getByText(/enter a name and a valid time range/i)).toBeInTheDocument();
    });
    expect(saveDraftConfirmationMock).not.toHaveBeenCalled();
  });

  it('adds a new shift to the day when add shift dialog is submitted', async () => {
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
    saveDraftConfirmationMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /event name/i }), { target: { value: 'Cashier' } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '13:00' } });
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '17:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
        shifts: expect.arrayContaining([
          expect.objectContaining({ role: 'Cashier', startTime: '13:00', endTime: '17:00', date: '2026-09-05' }),
        ]),
      }));
    });
  });

  it('discards new shift when cancel is clicked in add dialog', async () => {
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
    saveDraftConfirmationMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /event name/i }), { target: { value: 'Cashier' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(saveDraftConfirmationMock).not.toHaveBeenCalled();
  });

  it('supports adding multiple shifts to the same day', async () => {
    loadDraftConfirmationMock.mockReturnValue(null);
    loadAnalysisResponseMock.mockReturnValue({
      scheduleOwnerGuess: 'Alex',
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
      ],
    });

    renderConfirmPage();
    saveDraftConfirmationMock.mockClear();

    // Add first new shift
    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /event name/i }), { target: { value: 'Cashier' } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '13:00' } });
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '17:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    // Verify both shifts are now visible
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Cashier')).toBeInTheDocument();

    saveDraftConfirmationMock.mockClear();

    // Add second new shift to the same day
    fireEvent.click(screen.getByRole('button', { name: /add shift to sat/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /event name/i }), { target: { value: 'Supervisor' } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '17:00' } });
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '21:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
        shifts: expect.arrayContaining([
          expect.objectContaining({ role: 'Barista', startTime: '09:00', endTime: '12:00', date: '2026-09-05' }),
          expect.objectContaining({ role: 'Cashier', startTime: '13:00', endTime: '17:00', date: '2026-09-05' }),
          expect.objectContaining({ role: 'Supervisor', startTime: '17:00', endTime: '21:00', date: '2026-09-05' }),
        ]),
      }));
    });
  });

  it('renders and edits multiple shifts in a single day independently', async () => {
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

    // Verify both shifts render
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Cashier')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /edit shift/i })).toHaveLength(2);

    // Edit the first shift
    saveDraftConfirmationMock.mockClear();
    const editButtons = screen.getAllByRole('button', { name: /edit shift/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/start time/i)).toHaveValue('09:00');

    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '08:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(saveDraftConfirmationMock).toHaveBeenCalledWith(fakeUid, expect.objectContaining({
        shifts: expect.arrayContaining([
          expect.objectContaining({ role: 'Barista', startTime: '08:00', endTime: '12:00' }),
          expect.objectContaining({ role: 'Cashier', startTime: '13:00', endTime: '17:00' }),
        ]),
      }));
    });

    // Verify both shifts still render and the second is unaffected
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.getByText('Cashier')).toBeInTheDocument();
  });

  it('renders chevron buttons for navigating between days', () => {
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
        {
          date: '2026-09-06',
          startTime: '10:00',
          endTime: '18:00',
          role: 'Cashier',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 6 10:00 AM - 6:00 PM',
        },
      ],
      selectedCalendarId: 'primary',
    });
    loadAnalysisResponseMock.mockReturnValue(null);

    renderConfirmPage();

    expect(screen.getByRole('button', { name: /scroll to previous day/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scroll to next day/i })).toBeInTheDocument();
  });

  it('chevron buttons scroll the grid by one cell width when clicked', () => {
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
        {
          date: '2026-09-06',
          startTime: '10:00',
          endTime: '18:00',
          role: 'Cashier',
          location: 'Downtown',
          confidence: 0.9,
          rawText: 'Sep 6 10:00 AM - 6:00 PM',
        },
      ],
      selectedCalendarId: 'primary',
    });
    loadAnalysisResponseMock.mockReturnValue(null);

    renderConfirmPage();

    const grid = document.getElementById('confirm-card__grid') as HTMLDivElement;
    const nextButton = screen.getByRole('button', { name: /scroll to next day/i }) as HTMLButtonElement;

    // Mock clientWidth to simulate a non-zero viewport width
    Object.defineProperty(grid, 'clientWidth', {
      value: 300,
      configurable: true,
    });

    // Mock the scrollBy method since jsdom doesn't implement it
    let scrollByCall: { left: number; behavior: string } | undefined;
    (grid.scrollBy as any) = vi.fn((options: ScrollToOptions) => {
      scrollByCall = { left: options.left as number, behavior: options.behavior as string };
    });

    fireEvent.click(nextButton);

    expect(scrollByCall).toBeDefined();
    expect(scrollByCall?.left).toBeGreaterThan(0);
  });

  it('chevron buttons are disabled at the start and end of the range', () => {
    vi.useFakeTimers();
    try {
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

      const prevButton = screen.getByRole('button', { name: /scroll to previous day/i }) as HTMLButtonElement;
      const nextButton = screen.getByRole('button', { name: /scroll to next day/i }) as HTMLButtonElement;

      // At start, both prev and next buttons should be disabled (only one day available)
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });
});
