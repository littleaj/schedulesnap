import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import EditableText from '@/components/atoms/EditableText';
import {
  loadAnalysisResponse,
  loadDraftConfirmation,
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

const formatTime = (time: string) => timeFormatter.format(new Date(`1970-01-01T${time}`));

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
  const weekInfo = typeof Intl.Locale === 'function' ? new Intl.Locale(locale).getWeekInfo() : undefined;
  const firstDay = weekInfo?.firstDay ?? 7;
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

const ConfirmPage = () => {
  const navigate = useNavigate();
  const draftConfirmation = loadDraftConfirmation();
  const analysisResponse = draftConfirmation ? null : loadAnalysisResponse();
  const shifts = draftConfirmation?.shifts ?? analysisResponse?.shifts ?? [];
  const [weekDays, setWeekDays] = useState<WeekDay[]>(() => (shifts.length > 0 ? buildWeekDays(shifts) : []));

  const hasEditableShift = useMemo(() => {
    return weekDays.some((day) => day.shifts.some((shift) => shift.startTime || shift.endTime || shift.role || shift.location));
  }, [weekDays]);

  const updateShiftField = (dayIso: string, shiftId: string, field: keyof Pick<ScheduleAnalysisShift, 'startTime' | 'endTime' | 'role' | 'location'>, value: string) => {
    setWeekDays((currentWeekDays) => currentWeekDays.map((day) => {
      if (day.isoDate !== dayIso) {
        return day;
      }

      return {
        ...day,
        shifts: day.shifts.map((shift) => {
          if (shift.id !== shiftId) {
            return shift;
          }

          const nextShift = {
            ...shift,
            [field]: value,
            isPlaceholder: false,
          };

          return nextShift;
        }),
      };
    }));
  };

  return (
    <main className="confirm-page">
      <section className="confirm-card" aria-labelledby="confirm-title">
        <p className="confirm-card__eyebrow">Review and confirm</p>
        <h1 id="confirm-title">Review your extracted shifts</h1>

        {shifts.length > 0 ? (
          <>
            <p className="confirm-card__intro">
              {draftConfirmation
                ? 'Your saved review was restored from local storage.'
                : 'Your extracted shifts were restored from local storage.'}
            </p>

            <div className="confirm-card__summary" aria-label="Extracted shifts week view">
              <p>{shifts.length} extracted shift{shifts.length === 1 ? '' : 's'} ready for review.</p>
              <div className="confirm-card__grid" role="list" aria-label="Weekly schedule">
                {weekDays.map((day) => (
                  <div key={day.isoDate} className="confirm-card__day" role="listitem">
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
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="confirm-card__intro">No saved review was found. Start over from capture to continue.</p>
        )}

        <div className="confirm-card__actions">
          <ActionButton variant="primary" onClick={() => {
            // TODO create events with Google Calendar API
          }}
            disabled={!hasEditableShift}>
            Create Events
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
