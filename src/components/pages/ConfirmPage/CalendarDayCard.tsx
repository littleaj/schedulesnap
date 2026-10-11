import type { DragEvent } from "react";
import type { EditableShift, WeekDay } from "@/types/shift-display";
import { formatTimeToLocale } from "@/utils/formatTime";

export interface CalendarDayCardProps {
  day: WeekDay;
  onEditShift: (day: WeekDay, shift: EditableShift) => void;
  onRemoveShift: (isoDate: string, shiftId: string) => void;
  canRemoveShift: boolean;
  onAddShift: (isoDate: string) => void;
  onDragShiftStart: (dayIso: string, shiftId: string) => void;
  onDragShiftEnd: () => void;
  onDragShiftOverDay: (event: DragEvent<HTMLElement>) => void;
  onDropShift: (targetDayIso: string) => void;
}

const getShiftActionLabel = (prefix: string, day: WeekDay, shift: EditableShift) => [
  prefix,
  shift.eventName || shift.role || 'shift',
  `on ${day.weekday} ${day.monthDay}`,
  shift.startTime && shift.endTime ? `from ${shift.startTime} to ${shift.endTime}` : '',
].filter(Boolean).join(' ');

const CalendarDayCard = ({
  day,
  onEditShift,
  onRemoveShift,
  canRemoveShift,
  onAddShift,
  onDragShiftStart,
  onDragShiftEnd,
  onDragShiftOverDay,
  onDropShift,
}: CalendarDayCardProps) => {
  return (
    <div className="confirm-card__day">
      <p className="confirm-card__day-label">{day.weekday}</p>
      <article
        className="confirm-card__cell"
        aria-label={`${day.weekday} ${day.monthDay}`}
        onDragOver={onDragShiftOverDay}
        onDrop={() => onDropShift(day.isoDate)}
      >
        <div className="confirm-card__cell-header">
          <p className="confirm-card__cell-date">{day.monthDay}</p>
          <button
            type="button"
            className="material-symbols-outlined confirm-card__add-shift"
            aria-label={`Add shift to ${day.weekday} ${day.monthDay}`}
            onClick={() => onAddShift(day.isoDate)}
          >
            {'\ue146'}
          </button>
        </div>

        <div className="confirm-card__events">
          {day.shifts.map((shift) => (
            <div
              key={shift.id}
              className={`confirm-card__event ${shift.isPlaceholder ? 'confirm-card__event--off' : ''}`}
            >
              {!shift.isPlaceholder ? (
                <div className="confirm-card__event-header">
                  <p className="confirm-card__event-title">{shift.eventName || shift.role || 'Unnamed Shift'}</p>
                  <div className="confirm-card__event-actions">
                    <button
                      type="button"
                      className="material-symbols-outlined confirm-card__drag-handle"
                      aria-label={getShiftActionLabel('Drag shift', day, shift)}
                      draggable
                      onDragStart={() => onDragShiftStart(day.isoDate, shift.id)}
                      onDragEnd={onDragShiftEnd}
                    >
                      drag_indicator
                    </button>
                    <button
                      type="button"
                      className="material-symbols-outlined confirm-card__edit-shift"
                      aria-label={getShiftActionLabel('Edit shift', day, shift)}
                      onClick={() => onEditShift(day, shift)}
                    >
                      {'\ue3c9'}
                    </button>
                    <button
                      type="button"
                      className="material-symbols-outlined confirm-card__remove-shift"
                      aria-label={getShiftActionLabel('Remove shift', day, shift)}
                      onClick={() => onRemoveShift(day.isoDate, shift.id)}
                      disabled={!canRemoveShift}
                    >
                      {'\ue872'}
                    </button>
                  </div>
                </div>
              ) : null}
              {!shift.isPlaceholder ? (
                <div
                  className="confirm-card__event-summary"
                  onDoubleClick={() => onEditShift(day, shift)}
                >
                  <p className="confirm-card__cell-time">{formatTimeToLocale(shift.startTime)} &ndash; {formatTimeToLocale(shift.endTime)}</p>
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
