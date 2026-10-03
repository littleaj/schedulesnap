import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import { Card } from '@/components/atoms/Card';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import { useGoogleLogin } from '@/hooks/google-login';
import useCurrentUser from '@/hooks/current-user';
import gcalapi from '@/services/google-calendar';
import { clearAnalysisFlowCache, loadDraftConfirmation } from '@/services/schedule-analysis';
import { editableShift2GoogleCalendarEvent } from '@/utils/mappers';
import { buildWeekDays } from '@/components/pages/ConfirmPage/utils/weekdays';
import type { GoogleCalendarEvent } from '@/types/google-calendar';
import PageContent from '@/components/templates/PageContent';
import './CreatingPage.css';

type EventStatus = 'pending' | 'success' | 'failed';

interface QueuedEventItem {
  id: string;
  event: GoogleCalendarEvent;
  status: EventStatus;
}

const inFlightBatchKeys = new Set<string>();

const getEventId = (event: GoogleCalendarEvent) => `${event.summary}-${event.start.dateTime}-${event.end.dateTime}`;

const CreatingPage = () => {
  const user = useCurrentUser();
  const location = useLocation();
  const { getToken } = useContext(GoogleOAuthTokenContext);
  const { authenticate } = useGoogleLogin();

  if (!user) {
    // TODO: check other pages to see how they handle unauthenticated users
    throw new Error('User is not authenticated.');
  }

  const { uid } = user;
  const draftConfirmation = useMemo(() => loadDraftConfirmation(uid), [uid]);
  const calendarId = draftConfirmation?.selectedCalendarId ?? 'primary';
  const sourceEvents = useMemo(() => {
    if (!draftConfirmation) {
      return [] as GoogleCalendarEvent[];
    }

    const weekDays = buildWeekDays(draftConfirmation.shifts);

    return weekDays
      .flatMap((day) => day.shifts)
      .filter((shift) => !shift.isPlaceholder && shift.date && shift.startTime && shift.endTime)
      .map((shift) => editableShift2GoogleCalendarEvent(shift))
      .filter((event): event is NonNullable<typeof event> => event !== null);
  }, [draftConfirmation]);

  const autoRunKey = useMemo(() => {
    const runId = location.state?.createRunId ? location.state.createRunId : 'default';
    return `${uid}:${runId}:${calendarId}:${sourceEvents.map(getEventId).join('|')}`;
  }, [calendarId, location.state, sourceEvents, uid]);

  const [items, setItems] = useState<QueuedEventItem[]>(() =>
    sourceEvents.map((event, index) => ({
      id: `${index}-${getEventId(event)}`,
      event,
      status: 'pending',
    })),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);
  const completionHandledRef = useRef(false);

  useEffect(() => {
    setItems(sourceEvents.map((event, index) => ({
      id: `${index}-${getEventId(event)}`,
      event,
      status: 'pending',
    })));
    setHasAttempted(false);
    setAuthError(null);
    runningRef.current = false;
    autoStartAttemptedRef.current = false;
    completionHandledRef.current = false;
    setIsRunning(false);
  }, [sourceEvents]);

  const failedItems = useMemo(() => items.filter((item) => item.status === 'failed'), [items]);
  const completedItems = useMemo(() => items.filter((item) => item.status !== 'pending').length, [items]);
  const progressPercent = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;
  const isFinished = hasAttempted && items.length > 0 && failedItems.length === 0 && !isRunning;

  const markStatus = useCallback((id: string, status: EventStatus) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }, []);

  const createOneItem = useCallback(async (item: QueuedEventItem, accessToken: string) => {
    try {
      const response = await gcalapi.withAccessToken(accessToken).createEvent(calendarId, item.event);
      markStatus(item.id, response.ok ? 'success' : 'failed');
      return response;
    } catch (e) {
      console.error("Error creating event:", e);
      markStatus(item.id, 'failed');
      return null;
    }
  }, [calendarId, markStatus]);

  const stopWithAuthFailure = useCallback((targetItems: QueuedEventItem[], message: string) => {
    targetItems.forEach((item) => markStatus(item.id, 'failed'));
    setAuthError(message);
    setIsRunning(false);
    runningRef.current = false;
  }, [markStatus]);

  const resolveToken = useCallback(async (targetItems: QueuedEventItem[]) => {
    let accessToken = getToken();
    if (accessToken) {
      return accessToken;
    }

    await authenticate();
    accessToken = getToken();
    if (accessToken) {
      return accessToken;
    }

    stopWithAuthFailure(targetItems, 'Your Google sign-in needs a refresh before events can be created.');
    return null;
  }, [authenticate, getToken, stopWithAuthFailure]);

  const runUntilUnauthorized = useCallback(async (targetItems: QueuedEventItem[], accessToken: string) => {
    const retryAfterAuth: QueuedEventItem[] = [];
    let hadNonAuthFailure = false;

    for (const item of targetItems) {
      const response = await createOneItem(item, accessToken);
      if (response?.status === 401) {
        const currentIndex = targetItems.indexOf(item);
        retryAfterAuth.push(item, ...targetItems.slice(currentIndex + 1));
        break;
      }

      if (!response?.ok) {
        hadNonAuthFailure = true;
      }
    }

    return { retryAfterAuth, hadNonAuthFailure };
  }, [createOneItem]);

  const finalizeSuccess = useCallback(() => {
    if (completionHandledRef.current) {
      return;
    }

    completionHandledRef.current = true;
    clearAnalysisFlowCache(uid);
    window.history.replaceState(window.history.state, '', '/finished');
  }, [uid]);

  const runCreation = useCallback(async (runMode: 'all' | 'failed') => {
    if (runningRef.current) {
      return;
    }

    const batchKey = `${autoRunKey}:${runMode}`;
    if (inFlightBatchKeys.has(batchKey)) {
      return;
    }

    inFlightBatchKeys.add(batchKey);
    runningRef.current = true;
    setAuthError(null);

    const targetIds = items
      .filter((item) => runMode === 'all' ? item.status === 'pending' : item.status === 'failed')
      .map((item) => item.id);

    if (targetIds.length === 0) {
      setHasAttempted(true);
      runningRef.current = false;
      inFlightBatchKeys.delete(batchKey);
      return;
    }

    setIsRunning(true);
    setHasAttempted(true);

    const targetItems = items.filter((item) => targetIds.includes(item.id));
    targetItems.forEach((item) => {
      markStatus(item.id, 'pending');
    });

    try {
      const accessToken = await resolveToken(targetItems);
      if (!accessToken) {
        return;
      }

      let hadFailure = false;
      const { retryAfterAuth, hadNonAuthFailure } = await runUntilUnauthorized(targetItems, accessToken);
      hadFailure = hadNonAuthFailure;

      if (retryAfterAuth.length > 0) {
        await authenticate();
        const refreshedToken = getToken();
        if (!refreshedToken) {
          stopWithAuthFailure(retryAfterAuth, 'Your Google sign-in needs a refresh before events can be created.');
          return;
        }

        for (const item of retryAfterAuth) {
          const response = await createOneItem(item, refreshedToken);
          if (response?.status === 401) {
            hadFailure = true;
            markStatus(item.id, 'failed');
            retryAfterAuth
              .slice(retryAfterAuth.indexOf(item) + 1)
              .forEach((remaining) => markStatus(remaining.id, 'failed'));
            setAuthError('Reauthentication did not resolve Google Calendar authorization. Please try again later.');
            break;
          }

          if (!response?.ok) {
            hadFailure = true;
          }
        }
      }

      if (!hadFailure) {
        finalizeSuccess();
      }
    } finally {
      setIsRunning(false);
      runningRef.current = false;
      inFlightBatchKeys.delete(batchKey);
    }
  }, [authenticate, createOneItem, finalizeSuccess, getToken, items, markStatus, resolveToken, runUntilUnauthorized, stopWithAuthFailure]);

  useEffect(() => {
    if (!location.state?.create || items.length === 0 || hasAttempted || autoStartAttemptedRef.current) {
      return;
    }

    autoStartAttemptedRef.current = true;
    void runCreation('all');
  }, [autoRunKey, hasAttempted, items.length, location.state, runCreation]);

  const iconByStatus: Record<EventStatus, string> = {
    pending: '\ue9d0',
    success: '\ue86c',
    failed: '\ue000',
  };

  return (
    <PageContent className="creating-page">
      <Card className="creating-card" aria-live="polite">
        <p className="eyebrow">Calendar Sync</p>
        <h1 id="creating-title">Creating your events</h1>

        {items.length === 0 ? (
          <div className="creating-card__empty">
            <output>There are no events to create.</output>
            <Link to="/" replace>Home</Link>
          </div>
        ) : (
          <>
            {isFinished ? (
              <output className="creating-card__success">Creation complete</output>
            ) : (
              <div className="creating-card__progress">
                <progress max={100} value={progressPercent} aria-label="Creation progress" />
                <span>{progressPercent}%</span>
              </div>
            )}

            <ul className="creating-card__event-list" aria-label="Pending event creations">
              {items.map((item) => (
                <li key={item.id} className={`creating-card__event creating-card__event--${item.status}`}>
                  <span className="material-symbols-rounded creating-card__event-icon" aria-hidden="true">
                    {iconByStatus[item.status]}
                  </span>
                  <span className="creating-card__event-title">{item.event.summary} @ {item.event.start.dateTime}</span>
                </li>
              ))}
            </ul>

            {authError ? (
              <p className="creating-card__error" role="alert">{authError}</p>
            ) : null}

            <div className="creating-card__actions">
              {!location.state?.create && !hasAttempted ? (
                <ActionButton variant="primary" onClick={() => { void runCreation('all'); }} disabled={isRunning}>
                  Start Creating Events
                </ActionButton>
              ) : null}

              {failedItems.length > 0 ? (
                <ActionButton variant="secondary" onClick={() => { void runCreation('failed'); }} disabled={isRunning}>
                  Retry Failed Events
                </ActionButton>
              ) : null}
            </div>
          </>
        )}
      </Card>
    </PageContent>
  );
};

export default CreatingPage;
