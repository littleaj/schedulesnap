import React, { useRef } from 'react';
import { formatTimeToLocale } from '@/utils/formatTime';
import "./ShiftBlock.css";

import type { EditableShift, WeekDay } from '@/types/shift-display';
import { useDraggable } from '@dnd-kit/react';

interface ShiftBlockProps {
  shift: EditableShift;
  day: WeekDay;
  onEditShift: (day: WeekDay, shift: EditableShift) => void;
  onRemoveShift: (isoDate: string, shiftId: string) => void;
  canRemoveShift: boolean;
}

const ShiftBlock = ({
  shift,
  day,
  onEditShift,
  onRemoveShift,
  canRemoveShift,
}: ShiftBlockProps) => {
  const {ref: draggableItemRef, isDragging, handleRef } = useDraggable({
    id: shift.id,
    data: {
      dayIso: day.isoDate,
      shiftId: shift.id,
    }
  });

  const getShiftActionLabel = (prefix: string, day: WeekDay, shift: EditableShift) => [
    prefix,
    shift.eventName || shift.role || 'shift',
    `on ${day.weekday} ${day.monthDay}`,
    shift.startTime && shift.endTime ? `from ${shift.startTime} to ${shift.endTime}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={draggableItemRef}
      key={shift.id}
      className={`confirm-card__event ${shift.isPlaceholder ? 'confirm-card__event--off ' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      {!shift.isPlaceholder ? (
        <button
          className="material-symbols-outlined confirm-card__drag-handle"
          ref={handleRef}
          aria-label={getShiftActionLabel('Drag shift', day, shift)}
          title="Drag shift"
        >
          {'\ue945'}
        </button>
      ) : null}
      <div className="confirm-card__event-content">
        {!shift.isPlaceholder ? (
          <div className="confirm-card__event-header">
            <p className="confirm-card__event-title">{shift.eventName || shift.role || 'Unnamed Shift'}</p>
            <div className="confirm-card__event-actions">
              <button
                type="button"
                className="material-symbols-outlined confirm-card__edit-shift"
                aria-label={getShiftActionLabel('Edit shift', day, shift)}
                title="Edit shift"
                onClick={() => onEditShift(day, shift)}
              >
                {'\ue3c9'}
              </button>
              <button
                type="button"
                className="material-symbols-outlined confirm-card__remove-shift"
                aria-label={getShiftActionLabel('Remove shift', day, shift)}
                title="Remove shift"
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
    </div>
  );
};

export default ShiftBlock;
