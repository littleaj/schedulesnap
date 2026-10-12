import React, { type DragEvent } from 'react';
import type { EditableShift, WeekDay } from '@/types/shift-display';
import ShiftBlock from '../ShiftBlock';

export interface DayCellProps {
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

const DayCell = ({
  day,
  onEditShift,
  onRemoveShift,
  canRemoveShift,
  onAddShift,
  onDragShiftStart,
  onDragShiftEnd,
  onDragShiftOverDay,
  onDropShift,
}: DayCellProps) => {
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
          {day.shifts.toSorted((a, b) => a.startTime.localeCompare(b.startTime)).map((shift) => (
            <ShiftBlock
              key={shift.id}
              shift={shift}
              day={day}
              onDragShiftStart={onDragShiftStart}
              onDragShiftEnd={onDragShiftEnd}
              onEditShift={onEditShift}
              onRemoveShift={onRemoveShift}
              canRemoveShift={canRemoveShift}
            />
          ))}
        </div>
      </article>
    </div>
  );
};

export default DayCell;
