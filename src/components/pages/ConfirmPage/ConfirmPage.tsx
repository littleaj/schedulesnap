import React, { useEffect, useMemo, useState } from 'react';
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

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
});

const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
});

const toLocalDate = (date: string) => new Date(`${date}T00:00:00`);

const toLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatWeekday = (date: Date) => weekdayFormatter.format(date);

const formatMonthDay = (date: Date) => monthDayFormatter.format(date);

const formatTime = (time: string) => {
  if (!time?.trim()) {
    return '';
  }
  return timeFormatter.format(new Date(`1970-01-01T${time}`));
};


const formatShiftKey = ({ date, startTime, endTime, role, location }: ScheduleAnalysisShift) => {
  return `${date}-${startTime}-${endTime}-${role ?? ''}-${location ?? ''}`;
};

interface EditableShift extends ScheduleAnalysisShift {
  id: string;
  isPlaceholder: boolean;
}

interface WeekDay {
  isoDate: string;
  weekday: string;
  monthDay: string;
  shifts: EditableShift[];
}

const getWeekStartDate = (date: Date) => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const localeInfo = typeof Intl.Locale === 'function' ? new Intl.Locale(locale) : null;
  const weekInfo = typeof localeInfo?.getWeekInfo === 'function' ? localeInfo.getWeekInfo() : null;
  const firstDay = weekInfo?.firstDay ?? (locale.toLowerCase().startsWith('en-us') ? 7 : 1);
  const currentDay = date.getDay() === 0 ? 7 : date.getDay();
  const offset = (currentDay - firstDay + 7) % 7;

  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - offset);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

const buildWeekDays = (shifts: ScheduleAnalysisShift[]): WeekDay[] => {
  const firstShiftDate = shifts[0] ? toLocalDate(shifts[0].date) : null;
  const weekStart = firstShiftDate ? getWeekStartDate(firstShiftDate) : null;
  const groupedShifts = new Map<string, EditableShift[]>();

  for (const shift of shifts) {
    const dayShifts = groupedShifts.get(shift.date) ?? [];
    dayShifts.push({ ...shift, id: formatShiftKey(shift), isPlaceholder: false });
    groupedShifts.set(shift.date, dayShifts);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = weekStart ? new Date(weekStart) : new Date();
    if (weekStart) {
      dayDate.setDate(weekStart.getDate() + index);
    }

    const isoDate = toLocalIsoDate(dayDate);

    const weekday: WeekDay = {
      isoDate,
      weekday: formatWeekday(dayDate),
      monthDay: formatMonthDay(dayDate),
      shifts: groupedShifts.get(isoDate)?.map((shift) => ({
        ...shift,
        startTime: formatTime(shift.startTime),
        endTime: formatTime(shift.endTime),
        id: formatShiftKey(shift),
        isPlaceholder: false
      })) ?? [
          {
            id: `${isoDate}-placeholder`,
            date: isoDate,
            startTime: '',
            endTime: '',
            role: '',
            location: '',
            confidence: 0,
            rawText: '',
            isPlaceholder: true,
          },
        ],
    };

    return weekday;
  });
};

const convertTo24Hour = (timeValue: string): string => {
  if (!timeValue?.trim()) {
    return '';
  }

  const trimmedValue = timeValue.trim();
  const match = (/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i).exec(trimmedValue);

  if (!match) {
    return trimmedValue;
  }

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);
  const modifier = match[3]?.toLowerCase();

  if (modifier === 'pm' && hours < 12) {
    hours += 12;
  }

  if (modifier === 'am' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const ConfirmPage = () => {
  const navigate = useNavigate();
  const draftConfirmation = loadDraftConfirmation();
  const analysisResponse = draftConfirmation ? null : loadAnalysisResponse();
  const shifts = (draftConfirmation?.shifts ?? analysisResponse?.shifts ?? [])
    .filter(shift => shift.startTime || shift.endTime || shift.role || shift.location);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(() => (shifts.length > 0 ? buildWeekDays(shifts) : []));

  const hasEditableShift = useMemo(() => {
    return weekDays.some((day) => day.shifts.some((shift) => shift.startTime || shift.endTime || shift.role || shift.location));
  }, [weekDays]);

  const handleCreateEvents = async () => {
    const calendarId = draftConfirmation?.selectedCalendarId || 'primary';
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
        };
      }))
      .filter((event): event is NonNullable<typeof event> => event !== null);

    const createEventRequest = async (eventBody: { summary: string; location?: string; start: { dateTime: string; timeZone: string }; end: { dateTime: string; timeZone: string } }) => {
      // FIXME: get access token from Google OAuth flow
      let accessToken = "";
      let response = await fetch(
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

      if (response.status === 401) {
        // FIXME: handle token expiration and re-authentication
        // clearToken();
        accessToken = "";
        response = await fetch(
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

      return response;
    };

    await Promise.allSettled(eventsToCreate.map(createEventRequest));
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
