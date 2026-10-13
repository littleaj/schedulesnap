import React, { type DragEvent } from 'react';
import type { EditableShift, WeekDay } from '@/types/shift-display';
import ShiftBlock from '../ShiftBlock';
import { useDroppable } from '@dnd-kit/react';
import "./DayCell.css";

export interface DayCellProps {
  day: WeekDay;
  onEditShift: (day: WeekDay, shift: EditableShift) => void;
  onRemoveShift: (isoDate: string, shiftId: string) => void;
  canRemoveShift: boolean;
  onAddShift: (isoDate: string) => void;
}

const DayCell = ({
  day,
  onEditShift,
  onRemoveShift,
  canRemoveShift,
  onAddShift,
}: DayCellProps) => {
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: day.isoDate,
    data: {
      dayIso: day.isoDate,
    }
  });
  return (
    <div className="confirm-card__day">
      <p className="confirm-card__day-label">{day.weekday}</p>
      <article
        ref={droppableRef}
        className={"confirm-card__cell " + (isDropTarget ? 'drop-target' : '')}
        aria-label={`${day.weekday} ${day.monthDay}`}
      >
        <div className="confirm-card__cell-header">
          <p className="confirm-card__cell-date">{day.monthDay}</p>
          <button
            type="button"
            className="material-symbols-outlined confirm-card__add-shift"
            aria-label={`Add shift to ${day.weekday} ${day.monthDay}`}
            title={`Add shift to ${day.weekday} ${day.monthDay}`}
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
