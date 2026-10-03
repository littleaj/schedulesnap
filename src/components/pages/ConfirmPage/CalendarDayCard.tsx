import EditableText from "@/components/atoms/EditableText";
import type { WeekDay } from "@/types/shift-display";

export interface CalendarDayCardProps {
  day: WeekDay;
  updateShiftField: (isoDate: string, shiftId: string, field: "startTime" | "endTime" | "eventName" | "location", value: React.InputHTMLAttributes<HTMLInputElement>['value']) => void;
}

const CalendarDayCard = ({ day, updateShiftField }: CalendarDayCardProps) => {
  return (
    <div className="confirm-card__day">
      <p className="confirm-card__day-label">{day.weekday}</p>
      <article className="confirm-card__cell" aria-label={`${day.weekday} ${day.monthDay}`}>
        <p className="confirm-card__cell-date">{day.monthDay}</p>

        <div className="confirm-card__events">
          {day.shifts.map((shift) => (
            <div key={shift.id} className={`confirm-card__event ${shift.isPlaceholder ? 'confirm-card__event--off' : ''}`}>
              <div className="confirm-card__time-row">
                <label htmlFor={`start-time-${shift.id}`}>Start</label>
                <EditableText
                  id={`start-time-${shift.id}`}
                  value={shift.startTime}
                  placeholder="Start time"
                  ariaLabel={`${day.weekday} start time`}
                  onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'startTime', value)}
                  type="time"
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
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};

export default CalendarDayCard;
