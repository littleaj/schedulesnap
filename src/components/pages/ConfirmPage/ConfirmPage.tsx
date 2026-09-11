import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import EditableText from '@/components/atoms/EditableText';
import {
  loadAnalysisResponse,
  loadDraftConfirmation,
  saveDraftConfirmation
} from '@/services/schedule-analysis';
import './ConfirmPage.css';
import type { ScheduleAnalysisShift } from '@/types/schedule-analysis';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import { useGoogleLogin } from '@/hooks/google-login';
import type { WeekDay } from '@/types/shift-display';
import type { GoogleCalendarEvent } from '@/types/google-calendar';
import { convertTo24Hour } from '@/utils/time-utils';
import { buildWeekDays } from './utils/weekdays';

const ConfirmPage = () => {
  const navigate = useNavigate();
  const { getToken } = useContext(GoogleOAuthTokenContext);
  const { authenticate } = useGoogleLogin();

  const draftConfirmation = loadDraftConfirmation();
  const analysisResponse = draftConfirmation ? null : loadAnalysisResponse();
  const shifts = (draftConfirmation?.shifts ?? analysisResponse?.shifts ?? [])
  .filter(shift => shift.startTime || shift.endTime || shift.role || shift.location);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(() => (shifts.length > 0 ? buildWeekDays(shifts) : []));

  if (shifts.length > 0) {
    console.log("Loaded shifts from", draftConfirmation ? "draft confirmation" : "analysis response");
  }

  const hasEditableShift = useMemo(() => {
    return weekDays.some((day) => day.shifts.some((shift) => shift.startTime || shift.endTime || shift.role || shift.location));
  }, [weekDays]);

  const handleCreateEvents = async () => {
    if (!draftConfirmation) {
      console.error("No draft confirmation available, cannot create events.");
      return;
    }
    const calendarId = draftConfirmation.selectedCalendarId || 'primary';
    const eventsToCreate = weekDays.flatMap((day) => day.shifts
      .filter((shift) => !shift.isPlaceholder && shift.date && shift.startTime && shift.endTime)
      .map((shift) => {
        const start24Hour = convertTo24Hour(shift.startTime);
        const end24Hour = convertTo24Hour(shift.endTime);
        const startDateTime = new Date(`${shift.date}T${start24Hour}:00`);
        const endDateTime = new Date(`${shift.date}T${end24Hour}:00`);

        if (!start24Hour || !end24Hour || Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
          return null;
        }

        return {
          summary: shift.role || shift.location || 'Work Shift',
          location: shift.location || undefined,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
          },
        } satisfies GoogleCalendarEvent;
      }))
      .filter((event): event is NonNullable<typeof event> => event !== null);

    console.log('Number of events to create:', eventsToCreate.length);

    const doFetch = async (eventBody: GoogleCalendarEvent, accessToken: string) => {
      return await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        },
      );
    }

    const createEventRequest = async (eventBody: GoogleCalendarEvent) => {
      let accessToken = getToken();
      if (!accessToken) {
        await authenticate();
        accessToken = getToken();
        if (!accessToken) {
          throw new Error('Failed to obtain access token after authentication');
        }
      }
      console.log(`Creating event in ${calendarId} calendar: `, eventBody.summary, eventBody.start.dateTime);
      const response = await doFetch(eventBody, accessToken);

      if (response.status === 401) {
        // Unauthorized: Google OAuth token may have expired
        await authenticate();
        accessToken = getToken();
        if (!accessToken) {
          throw new Error('Failed to obtain access token after authentication');
        }
        return await doFetch(eventBody, accessToken);
      }

      return response;
    };

    const settledResponses = await Promise.allSettled(eventsToCreate.map(createEventRequest));
    const hasSuccess = settledResponses.some((result) => result.status === 'fulfilled' && result.value.ok);

    if (hasSuccess) {
      navigate('/finished', { replace: true });
    }
  };

  const updateShiftField = (dayIso: string, shiftId: string, field: keyof Pick<ScheduleAnalysisShift, 'startTime' | 'endTime' | 'role' | 'location'>, value: string) => {
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

      saveDraftConfirmation({
        shifts: nextWeekDays.flatMap((day) => day.shifts.map((val) => ({
          ...val,
          startTime: convertTo24Hour(val.startTime),
          endTime: convertTo24Hour(val.endTime),
        }))),
        selectedCalendarId: '' // TODO populate with default calendar ID
      });

      return nextWeekDays;
    });
  };

  useEffect(() => {
    if (draftConfirmation) {
      return;
    }

    saveDraftConfirmation({
      shifts: shifts.map(val => ({ ...val, startTime: convertTo24Hour(val.startTime), endTime: convertTo24Hour(val.endTime) })),
      selectedCalendarId: '' // TODO populate with default calendar ID
    });
  }, [shifts]);

  return (
    <main className="confirm-page">
      <section className="confirm-card" aria-labelledby="confirm-title">
        <p className="confirm-card__eyebrow">Review and confirm</p>
        <h1 id="confirm-title">Review your extracted shifts</h1>

        {shifts.length > 0 ? (
          <>
            <p className="confirm-card__intro">
              {draftConfirmation
                ? 'Continue reviewing your extracted shifts.'
                : 'Review shifts extracted from the image.'}
            </p>

            <div className="confirm-card__summary" aria-label="Extracted shifts week view">
              <p>{shifts.length} extracted shift{shifts.length === 1 ? '' : 's'} ready for review.</p>
              <ul className="confirm-card__grid" aria-label="Scanned weekly schedule">
                {weekDays.map((day) => (
                  <li key={day.isoDate} className="confirm-card__day">
                    <p className="confirm-card__day-label">{day.weekday}</p>
                    <article className="confirm-card__cell" aria-label={`${day.weekday} ${day.monthDay}`}>
                      <p className="confirm-card__cell-date">{day.monthDay}</p>

                      <div className="confirm-card__events">
                        {day.shifts.map((shift) => (
                          <div key={shift.id} className="confirm-card__event">
                            <div className="confirm-card__time-row">
                              <EditableText
                                value={shift.startTime}
                                placeholder="Start time"
                                ariaLabel={`${day.weekday} start time`}
                                onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'startTime', value)}
                              />
                              <span className="confirm-card__time-separator" aria-hidden="true">
                                -
                              </span>
                              <EditableText
                                value={shift.endTime}
                                placeholder="End time"
                                ariaLabel={`${day.weekday} end time`}
                                onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'endTime', value)}
                              />
                            </div>

                            <EditableText
                              value={shift.role ?? ''}
                              placeholder="Role"
                              ariaLabel={`${day.weekday} role`}
                              onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'role', value)}
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
          </>
        ) : (
          <p className="confirm-card__intro">No saved review was found. Start over from capture to continue.</p>
        )}

        <div className="confirm-card__actions">
          <ActionButton variant="primary" onClick={() => {
            void handleCreateEvents();
          }}
            disabled={!hasEditableShift}>
            {'Create Events'}
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {
            // TODO clear local storage and reset state
            navigate("/");
          }}
            disabled={!hasEditableShift}>
            Cancel and Delete Progress
          </ActionButton>
        </div>
      </section>
    </main>
  );
};

export default ConfirmPage;
