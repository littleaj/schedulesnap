import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarDayCard from "./CalendarDayCard";
import type { EditableShift, WeekDay } from "@/types/shift-display";
import useUserMessage from "@/hooks/user-message";

interface CalendarWeekListProps {
  shifts: WeekDay[];
  onChange: (weekDays: WeekDay[]) => void;
}

interface ShiftEditDraft {
  eventName: string;
  startTime: string;
  endTime: string;
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

interface ShiftEditDialogContentProps {
  initialDraft: ShiftEditDraft;
  onDraftChange: (draft: ShiftEditDraft) => void;
  shiftId: string;
}

const ShiftEditDialogContent = ({ initialDraft, onDraftChange, shiftId }: ShiftEditDialogContentProps) => {
  const [draft, setDraft] = useState<ShiftEditDraft>(initialDraft);

  useEffect(() => {
    onDraftChange(draft);
  }, [draft, onDraftChange]);

  return (
    <div className="confirm-card__edit-dialog">
      <label htmlFor={`edit-event-name-${shiftId}`}>Event Name</label>
      <input
        id={`edit-event-name-${shiftId}`}
        name="event-name"
        type="text"
        value={draft.eventName}
        onChange={(event) => {
          setDraft((currentDraft) => ({ ...currentDraft, eventName: event.target.value }));
        }}
      />
      <label htmlFor={`edit-start-time-${shiftId}`}>Start Time</label>
      <input
        id={`edit-start-time-${shiftId}`}
        name="start-time"
        type="text"
        value={draft.startTime}
        onChange={(event) => {
          setDraft((currentDraft) => ({ ...currentDraft, startTime: event.target.value }));
        }}
      />
      <label htmlFor={`edit-end-time-${shiftId}`}>End Time</label>
      <input
        id={`edit-end-time-${shiftId}`}
        name="end-time"
        type="text"
        value={draft.endTime}
        onChange={(event) => {
          setDraft((currentDraft) => ({ ...currentDraft, endTime: event.target.value }));
        }}
      />
    </div>
  );
};

const CalendarWeekList = ({ shifts, onChange }: CalendarWeekListProps) => {
  const { showModal, showToast, dismissToast } = useUserMessage();
  const [weekDays, setWeekDays] = useState<WeekDay[]>(shifts);
  const weekDaysRef = useRef<WeekDay[]>(shifts);
  const [pendingRemovals, setPendingRemovals] = useState<Record<string, number>>({});
  const pendingRemovalsRef = useRef<Record<string, number>>({});
  const pendingRemovalToastIdsRef = useRef<Record<string, number>>({});

  const updateShift = useCallback((dayIso: string, shiftId: string, updates: Pick<EditableShift, 'startTime' | 'endTime' | 'eventName'>) => {
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
              ...updates,
              isPlaceholder: false,
            };
          }),
        };
      });

      onChange(nextWeekDays);

      return nextWeekDays;
    });
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
  const prevIndicator = useRef<HTMLDivElement>(null);
  const nextIndicator = useRef<HTMLDivElement>(null);
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
