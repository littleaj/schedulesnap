import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import {
  clearAnalysisFlowCache,
  loadAnalysisResponse,
  loadCapturedSchedulePhoto,
  loadDraftConfirmation,
  saveDraftConfirmation
} from '@/services/schedule-analysis';
import './ConfirmPage.css';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import { useGoogleLogin } from '@/hooks/google-login';
import type { WeekDay } from '@/types/shift-display';
import type { GoogleCalendarEvent } from '@/types/google-calendar';
import { convertTo24Hour } from '@/utils/time-utils';
import { buildWeekDays } from './utils/weekdays';
import useCurrentUser from '@/hooks/current-user';
import { useUserProfile } from '@/hooks/user-profile';
import PhotoPanel from '@/components/atoms/PhotoPanel/PhotoPanel';
import { editableShift2GoogleCalendarEvent } from '@/utils/mappers';
import { Card } from '@/components/atoms/Card';
import gcalapi from '@/services/google-calendar';
import { sleep } from '@/utils/misc';
import CalendarWeekList from './CalendarWeekList';
import type { ScheduleAnalysisShift } from '@/types/schedule-analysis';
import PageContent from '@/components/templates/PageContent';

const ConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useContext(GoogleOAuthTokenContext);
  const { authenticate } = useGoogleLogin();
  const user = useCurrentUser();
  const profile = useUserProfile();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { uid } = user;

  const draftConfirmation = loadDraftConfirmation(uid);
  if (!draftConfirmation) {
    console.log('No draft confirmation found');
  }

  const analysisResponse = loadAnalysisResponse(uid);
  if (!draftConfirmation && !analysisResponse) {
    console.log('No analysis response found');
  }

  const capturedPhoto = useMemo(() => loadCapturedSchedulePhoto(uid), [uid]);
  const capturedPhotoDataUrl = capturedPhoto ? `data:${capturedPhoto.mimeType};base64,${capturedPhoto.base64}` : null;

  const shifts = (draftConfirmation?.shifts ?? analysisResponse?.shifts ?? [])
    .filter(shift => shift.startTime || shift.endTime || shift.role || shift.location);

  const weekDays = useMemo(() => (shifts.length > 0 ? buildWeekDays(shifts) : []), [shifts]);

  if (shifts.length > 0) {
    console.log("Loaded shifts from", draftConfirmation ? "draft confirmation" : "analysis response");
  }

  const hasEditableShift = useMemo(() => {
    return weekDays.some((day) => day.shifts.some((shift) => shift.startTime || shift.endTime || shift.eventName || shift.location));
  }, [weekDays]);

  const handleCreateEvents = async () => {
    if (!draftConfirmation) {
      console.error("No draft confirmation available, cannot create events.");
      return;
    }
    const calendarId = draftConfirmation.selectedCalendarId || 'primary';
    const eventsToCreate = weekDays.flatMap((day) => day.shifts
      .filter((shift) => !shift.isPlaceholder && shift.date && shift.startTime && shift.endTime)
      .map((element) => editableShift2GoogleCalendarEvent(element)))
      .filter((event): event is NonNullable<typeof event> => event !== null);

    console.log('Number of events to create:', eventsToCreate.length);

    let accessToken = getToken();
    if (!accessToken) {
      console.log('No access token found, initiating authentication...');
      await authenticate();
      await sleep(250);
      accessToken = getToken();
      if (!accessToken) {
        throw new Error('Failed to obtain access token after authentication');
      }
    }

    const createEventRequest = async (eventBody: GoogleCalendarEvent, accessToken: string) => {
      console.log(`Creating event in ${calendarId} calendar: `, eventBody.summary, eventBody.start.dateTime);
      const response = await gcalapi.withAccessToken(accessToken).createEvent(calendarId, eventBody);

      if (response.status === 401) {
        // Unauthorized: Google OAuth token may have expired
        await authenticate();
        const newToken = getToken();
        if (!newToken) {
          throw new Error('Failed to obtain access token after authentication');
        }
        return await gcalapi.withAccessToken(newToken).createEvent(calendarId, eventBody);
      }

      return response;
    };


    let hasSuccess = false;
    for (const event of eventsToCreate) {
      const response = await createEventRequest(event, accessToken);
      hasSuccess = hasSuccess || response.ok;
    }

    // TODO: Show loading indicator while creating events
    // TODO: Handle the case where none of the events were successfully created.
    // TODO: Handle the case where some events failed to be created.

    if (hasSuccess) {
      clearAnalysisFlowCache(user?.uid);
      navigate('/finished', { replace: true, viewTransition: true });
    }
  };

  const saveShifts = useCallback((shifts: ScheduleAnalysisShift[]) => {
    saveDraftConfirmation(uid, {
      shifts: shifts.map(val => ({
        ...val,
        startTime: convertTo24Hour(val.startTime),
        endTime: convertTo24Hour(val.endTime)
      })),
      selectedCalendarId: profile?.defaultCalendarId ?? 'primary'
    });
  }, [uid, profile?.defaultCalendarId]);

  const saveWeekDays = useCallback((weekDays: WeekDay[]) => {
    saveShifts(weekDays.flatMap(
      (day) => day.shifts.map(
        (val) => ({
          ...val,
          role: val.eventName,
          startTime: convertTo24Hour(val.startTime),
          endTime: convertTo24Hour(val.endTime),
          // TODO: use this when we convert to EditableShift
          // isPlaceholder: !val.startTime && !val.endTime && !val.eventName && !val.location,
        } satisfies ScheduleAnalysisShift)
      )
    ));
  }, [saveShifts]);

  useEffect(() => {
    if (draftConfirmation || !analysisResponse) {
      return;
    }

    saveDraftConfirmation(uid, {
      shifts: shifts.map(val => ({ ...val, startTime: convertTo24Hour(val.startTime), endTime: convertTo24Hour(val.endTime) })),
      selectedCalendarId: profile?.defaultCalendarId ?? 'primary'
    });
  }, [shifts]);

  return (
    <PageContent className="confirm-page">
      <Card element={<section/>} className="confirm-card" aria-labelledby="confirm-title">
        <div className="confirm-card__header">
          <div className="confirm-card__heading-group">
            <p className="eyebrow">Review schedule</p>
            <h1 id="confirm-title">Review your shifts</h1>
            <p className="confirm-card__intro">
              Compare your shifts with the scanned image below and make any necessary adjustments.
            </p>
          </div>
        </div>

        {shifts.length > 0 ? (
          <Card className="confirm-card__summary" aria-label="Extracted shifts week view">
            <p className="confirm-card__summary-result">{shifts.length} shift{shifts.length === 1 ? '' : 's'} are ready to review.</p>
            <p className="confirm-card__summary-instruction">Please review and edit your shifts as needed.</p>
            <CalendarWeekList
              shifts={weekDays}
              onChange={saveWeekDays}
            />
          </Card>
        ) : (
          <p className="confirm-card__intro">
            No saved review was found. Start over from <Link to="/capture" replace>capture</Link> to continue.
          </p>
        )}

        <div className="confirm-card__actions">
          <ActionButton variant="primary" onClick={() => { void handleCreateEvents(); }} disabled={!hasEditableShift}>
            Create Events
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {
            if (!user) {
              console.warn("No user found while attempting to clear analysis flow cache.");
            } else {
              clearAnalysisFlowCache(user.uid);
            }
            navigate("/");
          }}>
            Cancel and Delete Progress
          </ActionButton>
        </div>

        {analysisResponse?.warnings && analysisResponse.warnings.length > 0 ? (
          <Card element={<details />} className="confirm-card__warnings">
            <summary>Analysis Messages</summary>
            <ul>
              {analysisResponse.warnings.map((warning, index) => (
                <Card key={index} element={<li />} className="confirm-card__warning">{warning}</Card> // NOSONAR we're not reording this array, so index is fine for a key.
              ))}
            </ul>
          </Card>
        ) : null}
      </Card>
    </PageContent>
  );
};

export default ConfirmPage;
