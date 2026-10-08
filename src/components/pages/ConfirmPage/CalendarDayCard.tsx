import type { EditableShift, WeekDay } from "@/types/shift-display";

export interface CalendarDayCardProps {
  day: WeekDay;
  onEditShift: (day: WeekDay, shift: EditableShift) => void;
  onRemoveShift: (isoDate: string, shiftId: string) => void;
  canRemoveShift: boolean;
}

const CalendarDayCard = ({ day, onEditShift, onRemoveShift, canRemoveShift }: CalendarDayCardProps) => {
  return (
    <div className="confirm-card__day">
      <p className="confirm-card__day-label">{day.weekday}</p>
      <article className="confirm-card__cell" aria-label={`${day.weekday} ${day.monthDay}`}>
        <p className="confirm-card__cell-date">{day.monthDay}</p>

        <div className="confirm-card__events">
          {day.shifts.map((shift) => (
            <div key={shift.id} className={`confirm-card__event ${shift.isPlaceholder ? 'confirm-card__event--off' : ''}`}>
              {!shift.isPlaceholder ? (
                <div className="confirm-card__event-actions">
                  <button
                    type="button"
                    className="material-symbols-outlined confirm-card__edit-shift"
                    aria-label={[
                      'Edit shift',
                      shift.role || shift.eventName || 'shift',
                      `on ${day.weekday} ${day.monthDay}`,
                      shift.startTime && shift.endTime ? `from ${shift.startTime} to ${shift.endTime}` : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => onEditShift(day, shift)}
                  >
                    {'\ue3c9'}
                  </button>
                  <button
                    type="button"
                    className="material-symbols-outlined confirm-card__remove-shift"
                    aria-label={[
                      'Remove shift',
                      shift.role || shift.eventName || 'shift',
                      `on ${day.weekday} ${day.monthDay}`,
                      shift.startTime && shift.endTime ? `from ${shift.startTime} to ${shift.endTime}` : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => onRemoveShift(day.isoDate, shift.id)}
                    disabled={!canRemoveShift}
                  >
                    {'\ue872'}
                  </button>
                </div>
              ) : null}
              {!shift.isPlaceholder ? (
                <div
                  className="confirm-card__event-summary"
                  onDoubleClick={() => onEditShift(day, shift)}
                >
                  <p className="confirm-card__cell-role">{shift.eventName || shift.role || 'Shift'}</p>
                  <p className="confirm-card__cell-time">{shift.startTime || 'Start time'}</p>
                  <p className="confirm-card__cell-time">{shift.endTime || 'End time'}</p>
                  {shift.location ? <p className="confirm-card__cell-location">{shift.location}</p> : null}
                </div>
              ) : (
                <p className="confirm-card__cell-role">Day off</p>
              )}
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};

export default CalendarDayCard;
