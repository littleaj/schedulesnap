import EditableText from "@/components/atoms/EditableText";
import type { WeekDay } from "@/types/shift-display";

export interface CalendarDayCardProps {
  day: WeekDay;
  updateShiftField: (isoDate: string, shiftId: string, field: "startTime" | "endTime" | "eventName" | "location", value: React.InputHTMLAttributes<HTMLInputElement>['value']) => void;
}

const CalendarDayCard = ({ day, updateShiftField }: CalendarDayCardProps) => {
  return (
    <li className="confirm-card__day">
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
                  type="time"
                />
                <span className="confirm-card__time-separator" aria-hidden="true">
                  –
                </span>
                <EditableText
                  value={shift.endTime}
                  placeholder="End time"
                  ariaLabel={`${day.weekday} end time`}
                  onCommit={(value) => updateShiftField(day.isoDate, shift.id, 'endTime', value)}
                  type="time"
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
  );
};

export default CalendarDayCard;
