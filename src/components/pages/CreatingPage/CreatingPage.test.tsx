import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreatingPage from './CreatingPage';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';

const {
  loadDraftConfirmationMock,
  clearAnalysisFlowCacheMock,
  useCurrentUserMock,
  authenticateMock,
  createEventMock,
} = vi.hoisted(() => ({
  loadDraftConfirmationMock: vi.fn(),
  clearAnalysisFlowCacheMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  authenticateMock: vi.fn(),
  createEventMock: vi.fn(),
}));

vi.mock('@/hooks/current-user', () => ({
  default: () => useCurrentUserMock(),
}));

vi.mock('@/hooks/google-login', () => ({
  useGoogleLogin: () => ({
    authenticate: authenticateMock,
  }),
}));

vi.mock('@/services/schedule-analysis', () => ({
  clearAnalysisFlowCache: clearAnalysisFlowCacheMock,
  loadDraftConfirmation: loadDraftConfirmationMock,
}));

vi.mock('@/services/google-calendar', () => ({
  default: {
    withAccessToken: () => ({
      createEvent: createEventMock,
    }),
  },
}));

const fakeUid = 'creating-page-user';
const fakeToken = 'google-access-token';

const buildDraft = () => ({
  selectedCalendarId: 'primary',
  shifts: [
    {
      date: '2026-10-01',
      startTime: '09:00',
      endTime: '17:00',
      role: 'Shift A',
      location: 'Cafe',
      confidence: 0.9,
      rawText: '9-5',
    },
    {
      date: '2026-10-02',
      startTime: '10:00',
      endTime: '18:00',
      role: 'Shift B',
      location: 'Cafe',
      confidence: 0.9,
      rawText: '10-6',
    },
  ],
});

const renderPage = (state: unknown = undefined, getToken = vi.fn(() => fakeToken), strict = false) => {
  const normalizedState = (state && typeof state === 'object' && (state as { create?: boolean }).create)
    ? { ...(state as Record<string, unknown>), createRunId: (state as { createRunId?: string }).createRunId ?? `test-${Math.random().toString(36).slice(2)}` }
    : state;

  const page = (
    <GoogleOAuthTokenContext.Provider
      value={{
        getToken,
        setToken: vi.fn(),
        getTokenExpiresAt: vi.fn(),
        setTokenExpiresAt: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[{ pathname: '/creating', state: normalizedState }]}>
        <Routes>
          <Route path="/creating" element={<CreatingPage />} />
        </Routes>
      </MemoryRouter>
    </GoogleOAuthTokenContext.Provider>
  );

  return render(
    strict ? <React.StrictMode>{page}</React.StrictMode> : page,
  );
};

describe('CreatingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCurrentUserMock.mockReturnValue({ uid: fakeUid, displayName: 'Alex' });
    loadDraftConfirmationMock.mockReturnValue(buildDraft());
    createEventMock.mockResolvedValue({ ok: true, status: 200 });
  });

  it('does not start automatically when create state is not true', async () => {
    loadDraftConfirmationMock.mockReturnValue(buildDraft());

    renderPage({ create: false });

    await waitFor(() => {
      expect(createEventMock).not.toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(2);
    });
  });

  it('automatically starts creating events when create state is true', async () => {
    renderPage({ create: true });

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(2);
    });
  });

  it('shows fallback route behavior when there are no creatable draft events', async () => {
    loadDraftConfirmationMock.mockReturnValue({ selectedCalendarId: 'primary', shifts: [] });

    renderPage({ create: true });

    await waitFor(() => {
      expect(createEventMock).not.toHaveBeenCalled();
    });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href');
  });

  it('tracks per-event completion status and replaces URL when all events finish', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    renderPage({ create: true });

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(replaceStateSpy).toHaveBeenCalled();
    });

    expect(clearAnalysisFlowCacheMock).toHaveBeenCalledWith(fakeUid);
  });

  it('marks failed events and retries only failed events', async () => {

    createEventMock
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    renderPage({ create: true });

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(2);
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(3);
    });

    const thirdRequest = createEventMock.mock.calls[2];
    expect(thirdRequest[1]).toMatchObject({ summary: 'Shift B' });
  });

  it('uses authenticate flow when token is missing', async () => {
    loadDraftConfirmationMock.mockReturnValue({
      selectedCalendarId: 'primary',
      shifts: [buildDraft().shifts[0]],
    });

    const getToken = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(fakeToken);

    renderPage({ create: true }, getToken);

    await waitFor(() => {
      expect(authenticateMock).toHaveBeenCalledTimes(1);
      expect(createEventMock).toHaveBeenCalledTimes(1);
    });
  });

  it('stops pending requests on 401, reauthenticates once, and restarts pending events', async () => {
    createEventMock
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    renderPage({ create: true });

    await waitFor(() => {
      expect(authenticateMock).toHaveBeenCalledTimes(1);
      expect(createEventMock).toHaveBeenCalledTimes(3);
    });

    expect(createEventMock.mock.calls[1][1]).toMatchObject({ summary: 'Shift A' });
    expect(createEventMock.mock.calls[2][1]).toMatchObject({ summary: 'Shift B' });
  });

  it('shows an auth error and gives up when 401 happens again after reauth', async () => {
    createEventMock
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    renderPage({ create: true });

    await waitFor(() => {
      expect(authenticateMock).toHaveBeenCalledTimes(1);
      expect(createEventMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('avoids duplicate requests in strict mode auto-start', async () => {
    renderPage({ create: true }, vi.fn(() => fakeToken), true);

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledTimes(2);
    });
  });
});
