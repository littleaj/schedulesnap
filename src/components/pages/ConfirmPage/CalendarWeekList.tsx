import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarDayCard from "./CalendarDayCard";
import ShiftEditDialogContent, { type ShiftEditDraft } from "./ShiftEditDialogContent";
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
  const { showModal, showToast, dismissToast } = useUserMessage();
  const [weekDays, setWeekDays] = useState<WeekDay[]>(shifts);
  const weekDaysRef = useRef<WeekDay[]>(shifts);
  const [pendingRemovals, setPendingRemovals] = useState<Record<string, number>>({});
  const pendingRemovalsRef = useRef<Record<string, number>>({});
  const pendingRemovalToastIdsRef = useRef<Record<string, number>>({});

  const updateShift = useCallback((dayIso: string, shiftId: string, updates: Pick<EditableShift, 'startTime' | 'endTime' | 'eventName'>) => {
    const nextWeekDays = weekDays.map((day) => {
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
            ...updates,
            isPlaceholder: false,
          };
        }),
      };
    });
    setWeekDays(nextWeekDays);
    onChange(nextWeekDays);
  }, [onChange]);

  const openShiftEditor = useCallback(async (day: WeekDay, shift: EditableShift) => {
    if (shift.isPlaceholder) {
      return;
    }

    const initialDraft: ShiftEditDraft = {
      eventName: shift.eventName || shift.role || '',
      startTime: shift.startTime,
      endTime: shift.endTime,
    };
    let latestDraft = initialDraft;
    const editResult = await showModal({
      title: 'Edit shift',
      heading: `${day.weekday} ${day.monthDay}`,
      content: (
        <ShiftEditDialogContent
          initialDraft={initialDraft}
          shiftId={shift.id}
          onDraftChange={(draft) => {
            latestDraft = draft;
          }}
        />
      ),
      variant: 'information',
      actionLabels: ['OK', 'Cancel'],
    });

    if (editResult !== 'OK') {
      return;
    }

    updateShift(day.isoDate, shift.id, {
      eventName: latestDraft.eventName,
      startTime: latestDraft.startTime,
      endTime: latestDraft.endTime,
    });
  }, [showModal, updateShift]);

  const scroller = useRef<HTMLDivElement>(null);
  const prevIndicator = useRef<HTMLButtonElement>(null);
  const nextIndicator = useRef<HTMLButtonElement>(null);
  const hasPendingRemovals = useMemo(() => Object.keys(pendingRemovals).length > 0, [pendingRemovals]);

  const restoreShift = useCallback((isoDate: string, shiftId: string) => {
    const pendingKey = toPendingRemovalKey(isoDate, shiftId);
    const timerId = pendingRemovalsRef.current[pendingKey];
    const pendingToastId = pendingRemovalToastIdsRef.current[pendingKey];

    if (timerId === undefined) {
      return;
    }

    window.clearTimeout(timerId);
    const { [pendingKey]: _discard, ...remainingPendingRemovals } = pendingRemovalsRef.current;
    const { [pendingKey]: _discardToast, ...remainingToastIds } = pendingRemovalToastIdsRef.current;
    pendingRemovalsRef.current = remainingPendingRemovals;
    pendingRemovalToastIdsRef.current = remainingToastIds;
    setPendingRemovals(remainingPendingRemovals);
    if (pendingToastId !== undefined) {
      dismissToast(pendingToastId);
    }
  }, [dismissToast]);

  const removeShift = useCallback((isoDate: string, shiftId: string) => {
    const pendingKey = toPendingRemovalKey(isoDate, shiftId);

    if (pendingRemovalsRef.current[pendingKey] !== undefined) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextWeekDays = weekDaysRef.current.map((day) => {
        if (day.isoDate !== isoDate) {
          return day;
        }

        return {
          ...day,
          shifts: day.shifts.filter((shift) => shift.id !== shiftId),
        };
      });
      weekDaysRef.current = nextWeekDays;
      setWeekDays(nextWeekDays);
      onChange(nextWeekDays);

      const { [pendingKey]: _discard, ...remainingPendingRemovals } = pendingRemovalsRef.current;
      const { [pendingKey]: _discardToast, ...remainingToastIds } = pendingRemovalToastIdsRef.current;
      pendingRemovalsRef.current = remainingPendingRemovals;
      pendingRemovalToastIdsRef.current = remainingToastIds;
      setPendingRemovals(remainingPendingRemovals);
    }, REMOVE_SHIFT_TIMEOUT_MS);

    pendingRemovalsRef.current = {
      ...pendingRemovalsRef.current,
      [pendingKey]: timeoutId,
    };
    const removalToastId = showToast({
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
    pendingRemovalToastIdsRef.current = {
      ...pendingRemovalToastIdsRef.current,
      [pendingKey]: removalToastId,
    };
    setPendingRemovals(pendingRemovalsRef.current);
  }, [onChange, restoreShift, showToast, dismissToast]);

  const updateChevrons = useCallback(() => {
    if (!scroller.current || !prevIndicator.current || !nextIndicator.current) return;
    const maxScroll = scroller.current.scrollWidth - scroller.current.clientWidth;
    const atStart = scroller.current.scrollLeft <= 1;
    const atEnd = scroller.current.scrollLeft >= maxScroll - 1;

    prevIndicator.current.classList.toggle('visible', !atStart);
    prevIndicator.current.disabled = atStart;
    nextIndicator.current.classList.toggle('visible', !atEnd);
    nextIndicator.current.disabled = atEnd;
  }, [scroller, prevIndicator, nextIndicator]);

  const handleChevronClick = useCallback((direction: 'prev' | 'next') => {
    if (!scroller.current) return;
    
    // Calculate the scroll amount as the viewport width (one day cell)
    const scrollAmount = scroller.current.clientWidth;
    const scrollDistance = direction === 'next' ? scrollAmount : -scrollAmount;

    scroller.current.scrollBy({
      left: scrollDistance,
      behavior: 'smooth',
    });
  }, []);

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
    weekDaysRef.current = weekDays;
  }, [weekDays]);

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
      <button
        ref={prevIndicator}
        type="button"
        className="chevron prev"
        id="prevBtn"
        aria-label="Scroll to previous day"
        onClick={() => handleChevronClick('prev')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button
        ref={nextIndicator}
        type="button"
        className="chevron next"
        id="nextBtn"
        aria-label="Scroll to next day"
        onClick={() => handleChevronClick('next')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <div ref={scroller} id="confirm-card__grid" className="confirm-card__grid" aria-label="Scanned weekly schedule">
        {displayWeekDays.map((day) =>
          <CalendarDayCard
            key={day.isoDate}
            day={day}
            onEditShift={openShiftEditor}
            onRemoveShift={removeShift}
            canRemoveShift={!hasPendingRemovals}
          />)
        }
      </div>
    </>
  );
};

export default CalendarWeekList;
