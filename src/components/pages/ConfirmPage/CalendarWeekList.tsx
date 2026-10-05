import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarDayCard from "./CalendarDayCard";
import type { EditableShift, WeekDay } from "@/types/shift-display";
import useUserMessage from "@/hooks/user-message";

interface CalendarWeekListProps {
  shifts: WeekDay[];
  onChange: (weekDays: WeekDay[]) => void;
}

const REMOVE_SHIFT_TIMEOUT_MS = 5000;
const toPendingRemovalKey = (isoDate: string, shiftId: string) => `${isoDate}::${shiftId}`;
const createPlaceholderShift = (isoDate: string): EditableShift => ({
  id: `${isoDate}-placeholder`,
  date: isoDate,
  startTime: '',
  endTime: '',
  role: '',
  eventName: '',
  location: '',
  confidence: 0,
  rawText: '',
  isPlaceholder: true,
});

const CalendarWeekList = ({ shifts, onChange }: CalendarWeekListProps) => {
  const { showToast } = useUserMessage();
  const [weekDays, setWeekDays] = useState<WeekDay[]>(shifts);
  const [pendingRemovals, setPendingRemovals] = useState<Record<string, number>>({});
  const pendingRemovalsRef = useRef<Record<string, number>>({});

  const updateShiftField = useCallback((dayIso: string, shiftId: string, field: 'startTime' | 'endTime' | 'eventName' | 'location', value: React.InputHTMLAttributes<HTMLInputElement>['value']) => {
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

      onChange(nextWeekDays);

      return nextWeekDays;
    });
  }, [onChange]);

  const scroller = useRef<HTMLDivElement>(null);
  const prevIndicator = useRef<HTMLDivElement>(null);
  const nextIndicator = useRef<HTMLDivElement>(null);
  const hasPendingRemovals = useMemo(() => Object.keys(pendingRemovals).length > 0, [pendingRemovals]);

  const restoreShift = useCallback((isoDate: string, shiftId: string) => {
    const pendingKey = toPendingRemovalKey(isoDate, shiftId);

    setPendingRemovals((currentPendingRemovals) => {
      const timerId = currentPendingRemovals[pendingKey];
      if (timerId === undefined) {
        return currentPendingRemovals;
      }

      window.clearTimeout(timerId);
      const { [pendingKey]: _discard, ...remainingPendingRemovals } = currentPendingRemovals;
      return remainingPendingRemovals;
    });
  }, []);

  const removeShift = useCallback((isoDate: string, shiftId: string) => {
    const pendingKey = toPendingRemovalKey(isoDate, shiftId);
    let hasScheduledRemoval = false;

    setPendingRemovals((currentPendingRemovals) => {
      if (currentPendingRemovals[pendingKey] !== undefined) {
        return currentPendingRemovals;
      }

      const timeoutId = window.setTimeout(() => {
        setWeekDays((currentWeekDays) => {
          const nextWeekDays = currentWeekDays.map((day) => {
            if (day.isoDate !== isoDate) {
              return day;
            }

            return {
              ...day,
              shifts: day.shifts.filter((shift) => shift.id !== shiftId),
            };
          });

          onChange(nextWeekDays);
          return nextWeekDays;
        });

        setPendingRemovals((currentPendingRemovals) => {
          const { [pendingKey]: _discard, ...remainingPendingRemovals } = currentPendingRemovals;
          return remainingPendingRemovals;
        });
      }, REMOVE_SHIFT_TIMEOUT_MS);

      hasScheduledRemoval = true;
      return {
        ...currentPendingRemovals,
        [pendingKey]: timeoutId,
      };
    });

    if (hasScheduledRemoval) {
      showToast({
        title: 'Shift removed',
        content: (
          <button
            type="button"
            className="confirm-card__undo"
            onClick={() => restoreShift(isoDate, shiftId)}
          >
            Undo
          </button>
        ),
        timeoutMs: REMOVE_SHIFT_TIMEOUT_MS,
        variant: 'information',
      });
    }
  }, [onChange, restoreShift, showToast]);

  const updateChevrons = useCallback(() => {
    if (!scroller.current || !prevIndicator.current || !nextIndicator.current) return;
    const maxScroll = scroller.current.scrollWidth - scroller.current.clientWidth;
    const atStart = scroller.current.scrollLeft <= 1;
    const atEnd = scroller.current.scrollLeft >= maxScroll - 1;

    prevIndicator.current.classList.toggle('visible', !atStart);
    nextIndicator.current.classList.toggle('visible', !atEnd);
  }, [scroller, prevIndicator, nextIndicator]);

  const [isTicking, setIsTicking] = useState(false);

  const handleScroll = useCallback(() => {
    if (isTicking) return;
    setIsTicking(true);

    requestAnimationFrame(() => {
      updateChevrons();
      setIsTicking(false);
    });
  }, [isTicking, updateChevrons]);

  useEffect(() => {
    pendingRemovalsRef.current = pendingRemovals;
  }, [pendingRemovals]);

  useEffect(() => {
    return () => {
      Object.values(pendingRemovalsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const displayWeekDays = useMemo(() => weekDays.map((day) => {
    const visibleShifts = day.shifts.filter((shift) => pendingRemovals[toPendingRemovalKey(day.isoDate, shift.id)] === undefined);
    return {
      ...day,
      shifts: visibleShifts.length > 0 ? visibleShifts : [createPlaceholderShift(day.isoDate)],
    };
  }), [weekDays, pendingRemovals]);

  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.addEventListener('scroll', handleScroll);
    return () => {
      scroller.current?.removeEventListener('scroll', handleScroll);
    };
  }, [scroller, handleScroll]);

  useEffect(() => {
    window.addEventListener('resize', updateChevrons);
    updateChevrons();
    return () => {
      window.removeEventListener('resize', updateChevrons);
    };
  }, [updateChevrons]);

  return (
    <>
      <div ref={prevIndicator} className="chevron prev" id="prevBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </div>
      <div ref={nextIndicator} className="chevron next" id="nextBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
      <div ref={scroller} id="confirm-card__grid" className="confirm-card__grid" aria-label="Scanned weekly schedule">
        {displayWeekDays.map((day) =>
          <CalendarDayCard
            key={day.isoDate}
            day={day}
            updateShiftField={updateShiftField}
            onRemoveShift={removeShift}
            canRemoveShift={!hasPendingRemovals}
          />)
        }
      </div>
    </>
  );
};

export default CalendarWeekList;
