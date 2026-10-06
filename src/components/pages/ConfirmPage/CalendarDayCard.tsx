import EditableText from "@/components/atoms/EditableText";
import type { WeekDay } from "@/types/shift-display";
import { isShiftValid } from "./utils/shift-validation";

export interface CalendarDayCardProps {
  day: WeekDay;
  updateShiftField: (isoDate: string, shiftId: string, field: "startTime" | "endTime" | "eventName" | "location", value: React.InputHTMLAttributes<HTMLInputElement>['value']) => void;
  onRemoveShift: (isoDate: string, shiftId: string) => void;
  canRemoveShift: boolean;
}

const CalendarDayCard = ({ day, updateShiftField, onRemoveShift, canRemoveShift }: CalendarDayCardProps) => {
  return (
    <div className="confirm-card__day">
      <p className="confirm-card__day-label">{day.weekday}</p>
      <article className="confirm-card__cell" aria-label={`${day.weekday} ${day.monthDay}`}>
        <p className="confirm-card__cell-date">{day.monthDay}</p>

        <div className="confirm-card__events">
          {day.shifts.map((shift) => {
            const shiftIsInvalid = !isShiftValid(shift);
            const invalidIndicatorId = `invalid-indicator-${shift.id}`;

            return (
              <div key={shift.id} className={`confirm-card__event ${shift.isPlaceholder ? 'confirm-card__event--off' : ''} ${shiftIsInvalid ? 'confirm-card__event--invalid' : ''}`}>
                {!shift.isPlaceholder ? (
                  <div className="confirm-card__event-actions">
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
                <div className="confirm-card__time-row">
                  <label htmlFor={`start-time-${shift.id}`}>Start</label>
                  <EditableText
                    id={`start-time-${shift.id}`}
                    value={shift.startTime}
                    placeholder="Start time"
                    ariaLabel={`${day.weekday} start time`}
                    onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'startTime', value)}
                    type="time"
                    required
                    aria-invalid={shiftIsInvalid}
                    aria-describedby={shiftIsInvalid ? invalidIndicatorId : undefined}
                  />

                </div>
                <div className="confirm-card__time-row">
                  <label htmlFor={`end-time-${shift.id}`}>End</label>
                  <EditableText
                    id={`end-time-${shift.id}`}
                    value={shift.endTime}
                    placeholder="End time"
                    ariaLabel={`${day.weekday} end time`}
                    onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'endTime', value)}
                    type="time"
                    required
                    aria-invalid={shiftIsInvalid}
                    aria-describedby={shiftIsInvalid ? invalidIndicatorId : undefined}
                  />
                </div>

                <div>
                  <label htmlFor={`event-name-${shift.id}`}>Event Name</label>
                  <EditableText
                    id={`event-name-${shift.id}`}
                    value={shift.eventName ?? shift.role ?? ''}
                    placeholder="Event name"
                    ariaLabel={`${day.weekday} event name`}
                    onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'eventName', value)}
                    required
                    aria-invalid={shiftIsInvalid}
                    aria-describedby={shiftIsInvalid ? invalidIndicatorId : undefined}
                  />
                </div>

                <div>
                  <label htmlFor={`location-${shift.id}`}>Location</label>
                  <EditableText
                    id={`location-${shift.id}`}
                    value={shift.location ?? ''}
                    placeholder="Location"
                    ariaLabel={`${day.weekday} location`}
                    onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'location', value)}
                  />
                </div>
                {shiftIsInvalid ? <p id={invalidIndicatorId} className="confirm-card__event-invalid-indicator">Invalid shift</p> : null}
              </div>
            )
          })}
        </div>
      </article>
    </div>
  );
};

export default CalendarDayCard;
