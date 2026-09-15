import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import EditableText from '@/components/atoms/EditableText';
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
import type { EditableShift, WeekDay } from '@/types/shift-display';
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

const ConfirmPage = () => {
  const navigate = useNavigate();
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

  const [weekDays, setWeekDays] = useState<WeekDay[]>(() => (shifts.length > 0 ? buildWeekDays(shifts) : []));

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

    // TODO: Handle the case where none of the events were successfully created.
    // TODO: Handle the case where some events failed to be created.

    if (hasSuccess) {
      clearAnalysisFlowCache(user?.uid);
      navigate('/finished', { replace: true, viewTransition: true });
    }
  };

  const updateShiftField = (dayIso: string, shiftId: string, field: keyof Pick<EditableShift, 'startTime' | 'endTime' | 'eventName' | 'location'>, value: string) => {
    setWeekDays((currentWeekDays) => {
      const nextWeekDays = currentWeekDays.map((day) => {
        if (day.isoDate !== dayIso) {
          return day;
        }

        return {
          ...day,
          shifts: day.shifts.map((shift) => {
            if (shift.id !== shiftId) {
              return shift;
            }

            return {
              ...shift,
              [field]: value,
              isPlaceholder: false,
            };
          }),
        };
      });

      saveDraftConfirmation(uid, {
        shifts: nextWeekDays.flatMap(
          (day) => day.shifts.map(
            (val) => ({
              ...val,
              role: val.eventName,
              startTime: convertTo24Hour(val.startTime),
              endTime: convertTo24Hour(val.endTime),
              isPlaceholder: !val.startTime && !val.endTime && !val.eventName && !val.location,
            })
          )
        ),
        selectedCalendarId: profile?.defaultCalendarId ?? 'primary'
      });

      return nextWeekDays;
    });
  };

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
    <main className="confirm-page">
      <section className="confirm-card" aria-labelledby="confirm-title">
        <div className="confirm-card__header">
          <div className="confirm-card__heading-group">
            <p className="confirm-card__eyebrow">Review schedule</p>
            <h1 id="confirm-title">Review your shifts</h1>
            <p className="confirm-card__intro">
              Compare your shifts with the scanned image below and make any necessary adjustments.
            </p>
          </div>

          {capturedPhotoDataUrl ? (
            <PhotoPanel src={capturedPhotoDataUrl} />
          ) : null}
        </div>

        {shifts.length > 0 ? (
          <div className="confirm-card__summary" aria-label="Extracted shifts week view">
            <p className="confirm-card__summary-result">{shifts.length} shift{shifts.length === 1 ? '' : 's'} are ready to review.</p>
            <p className="confirm-card__summary-instruction">Please review and edit your shifts as needed. Double click on the text to make changes.</p>
            <ul className="confirm-card__grid" aria-label="Scanned weekly schedule">
              {weekDays.map((day) => (
                <li key={day.isoDate} className="confirm-card__day">
                  <p className="confirm-card__day-label">{day.weekday}</p>
                  <article className="confirm-card__cell" aria-label={`${day.weekday} ${day.monthDay}`}>
                    <p className="confirm-card__cell-date">{day.monthDay}</p>

                    <div className="confirm-card__events">
                      {day.shifts.map((shift) => (
                        <div key={shift.id} className={`confirm-card__event ${shift.isPlaceholder ? 'confirm-card__event--off' : ''}`}>
                          <div className="confirm-card__time-row">
                            <EditableText
                              value={shift.startTime}
                              placeholder="Start time"
                              ariaLabel={`${day.weekday} start time`}
                              onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'startTime', value)}
                              inputWidth={10}
                            />
                            <span className="confirm-card__time-separator" aria-hidden="true">
                              –
                            </span>
                            <EditableText
                              value={shift.endTime}
                              placeholder="End time"
                              ariaLabel={`${day.weekday} end time`}
                              onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'endTime', value)}
                              inputWidth={10}
                            />
                          </div>

                          <EditableText
                            value={shift.eventName ?? shift.role ?? ''}
                            placeholder="Event name"
                            ariaLabel={`${day.weekday} event name`}
                            onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'eventName', value)}
                          />

                          <EditableText
                            value={shift.location ?? ''}
                            placeholder="Location"
                            ariaLabel={`${day.weekday} location`}
                            onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'location', value)}
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
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
          <Card>
            <details className="confirm-card__warnings">
              <summary>Analysis Summary</summary>
              <ul>
                {analysisResponse.warnings.map((warning, index) => (
                  <li key={index} className="confirm-card__warning card">{warning}</li> // NOSONAR we're not reording this array, so index is fine for a key.
                ))}
              </ul>
            </details>
          </Card>
        ) : null}

      </section>
    </main>
  );
};

export default ConfirmPage;
