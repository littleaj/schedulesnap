import { useState, useCallback, useContext, useRef, useMemo } from 'react';
import gcalapi from "@/services/google-calendar";
import type { GoogleCalendarEvent } from '@/types/google-calendar';
import type { EventStatus, QueuedEventItem } from '../types';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import { useGoogleLogin } from '@/hooks/google-login';
import { clearAnalysisFlowCache } from '@/services/schedule-analysis';
import useCurrentUser from '@/hooks/current-user';
import { useLocation } from 'react-router';

const toQueue = (events: GoogleCalendarEvent[]): QueuedEventItem[] => events.map((event, index) => ({
  id: `${index}-${event.summary}-${event.start.dateTime}-${event.end.dateTime}`,
  event,
  status: 'pending',
}));

const tryCreate = async (calendarId: string, token: string, event: GoogleCalendarEvent) => {
  try {
    return await gcalapi.withAccessToken(token).createEvent(calendarId, event);
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
};

// FROM OLD IMPLEMENTATION
const inFlightBatchKeys = new Set<string>();
const getEventId = (event: GoogleCalendarEvent) => `${event.summary}-${event.start.dateTime}-${event.end.dateTime}`;
// END OLD IMPLEMENTATION

const useCreationQueue = (events: GoogleCalendarEvent[], calendarId: string) => {

  const { getToken } = useContext(GoogleOAuthTokenContext);
  const { authenticate } = useGoogleLogin();

  const [items, setItems] = useState<QueuedEventItem[]>(() => toQueue(events));
  const [isRunning, setIsRunning] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const setStatus = useCallback((ids: string[], status: EventStatus) => {
    setItems(cur => cur.map(item => ids.includes(item.id) ? { ...item, status } : item));
  }, []);

  const reauthenticate = useCallback(async () => {
    await authenticate();
    return getToken();
  }, [authenticate, getToken]);




  // ============================
  // ==OLD IMPLEMENTAITON BELOW==
  // ============================

  const [hasAttempted, setHasAttempted] = useState(false);

  const user = useCurrentUser();
  const uid = user?.uid;
  if (!uid) throw new Error("User is not authenticated.");
  const completionHandledRef = useRef(false);

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


  const location = useLocation();
  const autoRunKey = useMemo(() => {
    const runId = location.state?.createRunId ? location.state.createRunId : 'default';
    return `${uid}:${runId}:${calendarId}:${events.map(getEventId).join('|')}`;
  }, [calendarId, location.state, events, uid]);

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
  }, [authenticate, autoRunKey, createOneItem, finalizeSuccess, getToken, items, markStatus, resolveToken, runUntilUnauthorized, stopWithAuthFailure]);

  const doneCount = items.filter((item) => item.status !== 'pending').length;

  return {
    items,
    isRunning,
    authError,
    progressPercent: items.length ? Math.round((doneCount / items.length) * 100) : 0,
    hasFailures: items.some((item) => item.status === 'failed'),
    isFinished: items.length && items.every((item) => item.status === 'success'),
    canStart: !isRunning && items.some((item) => item.status === 'pending'),
    start: () => runCreation("all"),
    retryFailed: () => runCreation("failed"),
    hasAttempted,
  }

};

export default useCreationQueue;
