import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarDayCard from "./CalendarDayCard";
import ShiftEditDialogContent, { type ShiftEditDraft } from "./ShiftEditDialogContent";
import type { EditableShift, WeekDay } from "@/types/shift-display";
import useUserMessage from "@/hooks/user-message";
import type { ToastMessage } from "@/contexts/user-message";

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
  boundingBox: {
    xMin: 0,
    yMin: 0,
    xMax: 1000,
    yMax: 1000,
  },
  isPlaceholder: true,
});

const createNewShift = (isoDate: string): EditableShift => ({
  id: `${isoDate}-new-${crypto?.randomUUID?.() ?? Date.now()}`,
  date: isoDate,
  startTime: '',
  endTime: '',
  role: '',
  eventName: '',
  location: '',
  confidence: 0,
  rawText: '',
  isPlaceholder: false,
});

const validateShiftDraft = (draft: ShiftEditDraft) => {
  const eventName = draft.eventName;
  const startTime = draft.startTime;
  const endTime = draft.endTime;

  if (!eventName || !startTime || !endTime) {
    return false;
  }

  const startMinutes = Number.parseInt(startTime.slice(0, 2), 10) * 60 + Number.parseInt(startTime.slice(3, 5), 10);
  const endMinutes = Number.parseInt(endTime.slice(0, 2), 10) * 60 + Number.parseInt(endTime.slice(3, 5), 10);

  return endMinutes > startMinutes;
};

const showInvalidShiftToast = (showToast: (message: ToastMessage) => number) => {
  showToast({
    title: 'Invalid shift',
    content: 'Enter a name and a valid time range where the start time is before the end time.',
    variant: 'error',
    timeoutMs: 5000,
  });
};

const clearPendingRemoval = (
  pendingKey: string,
  pendingRemovalsRef: React.MutableRefObject<Record<string, number>>,
  pendingRemovalToastIdsRef: React.MutableRefObject<Record<string, number>>,
  dismissToast?: (id: number) => void,
) => {
  const timerId = pendingRemovalsRef.current[pendingKey];
  const toastId = pendingRemovalToastIdsRef.current[pendingKey];

  if (timerId !== undefined) {
    window.clearTimeout(timerId);
  }

  const { [pendingKey]: _discardTimer, ...remainingTimers } = pendingRemovalsRef.current;
  const { [pendingKey]: _discardToast, ...remainingToasts } = pendingRemovalToastIdsRef.current;

  pendingRemovalsRef.current = remainingTimers;
  pendingRemovalToastIdsRef.current = remainingToasts;

  if (dismissToast && toastId !== undefined) {
    dismissToast(toastId);
  }
};

const CalendarWeekList = ({ shifts, onChange }: CalendarWeekListProps) => {
  const { showModal, showToast, dismissToast } = useUserMessage();
  const [weekDays, setWeekDays] = useState<WeekDay[]>(shifts);
  const weekDaysRef = useRef<WeekDay[]>(shifts);
  const [pendingRemovals, setPendingRemovals] = useState<Record<string, number>>({});
  const pendingRemovalsRef = useRef<Record<string, number>>({});
  const pendingRemovalToastIdsRef = useRef<Record<string, number>>({});

  const updateShift = useCallback((dayIso: string, shiftId: string, updates: Pick<EditableShift, 'startTime' | 'endTime' | 'eventName'>) => {
    const nextWeekDays = weekDaysRef.current.map((day) => {
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
    weekDaysRef.current = nextWeekDays;
    setWeekDays(nextWeekDays);
    onChange(nextWeekDays);
  }, [onChange]);

  const editShiftInputRef = useRef<HTMLInputElement>(null);
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
          nameInputRef={editShiftInputRef}
        />
      ),
      variant: 'information',
      actionLabels: ['OK', 'Cancel'],
      onShow: () => {
        editShiftInputRef.current?.select();
      },
    });

    if (editResult !== 'OK') {
      return;
    }

    const trimmedDraft = {
      eventName: latestDraft.eventName.trim(),
      startTime: latestDraft.startTime.trim(),
      endTime: latestDraft.endTime.trim(),
    };

    if (!validateShiftDraft(trimmedDraft)) {
      showInvalidShiftToast(showToast);
      return;
    }

    updateShift(day.isoDate, shift.id, {
      eventName: trimmedDraft.eventName,
      startTime: trimmedDraft.startTime,
      endTime: trimmedDraft.endTime,
    });
  }, [showModal, showToast, updateShift]);

  const addShiftInputRef = useRef<HTMLInputElement>(null);
  const addNewShift = useCallback(async (isoDate: string) => {
    const day = weekDaysRef.current.find((d) => d.isoDate === isoDate);
    if (!day) {
      return;
    }

    const newShift = createNewShift(isoDate);
    const initialDraft: ShiftEditDraft = {
      eventName: '',
      startTime: '',
      endTime: '',
    };
    let latestDraft = initialDraft;
    const editResult = await showModal({
      title: 'Add shift',
      heading: `${day.weekday} ${day.monthDay}`,
      content: (
        <ShiftEditDialogContent
          initialDraft={initialDraft}
          shiftId={newShift.id}
          onDraftChange={(draft) => {
            latestDraft = draft;
          }}
          nameInputRef={addShiftInputRef}
        />
      ),
      variant: 'information',
      actionLabels: ['OK', 'Cancel'],
      onShow: () => {
        addShiftInputRef.current?.focus();
      },
    });

    if (editResult !== 'OK') {
      return;
    }

    const trimmedDraft = {
      eventName: latestDraft.eventName.trim(),
      startTime: latestDraft.startTime.trim(),
      endTime: latestDraft.endTime.trim(),
    };

    if (!validateShiftDraft(trimmedDraft)) {
      showInvalidShiftToast(showToast);
      return;
    }

    const nextWeekDays = weekDaysRef.current.map((d) => {
      if (d.isoDate !== isoDate) {
        return d;
      }

      const nonPlaceholderShifts = d.shifts.filter((shift) => !shift.isPlaceholder);

      return {
        ...d,
        shifts: [
          ...nonPlaceholderShifts,
          {
            ...newShift,
            eventName: trimmedDraft.eventName,
            role: trimmedDraft.eventName,
            startTime: trimmedDraft.startTime,
            endTime: trimmedDraft.endTime,
            isPlaceholder: false,
          },
        ],
      };
    });

    weekDaysRef.current = nextWeekDays;
    setWeekDays(nextWeekDays);
    onChange(nextWeekDays);
  }, [showModal, showToast, onChange]);

  const scroller = useRef<HTMLDivElement>(null);
  const prevIndicator = useRef<HTMLButtonElement>(null);
  const nextIndicator = useRef<HTMLButtonElement>(null);
  const hasPendingRemovals = useMemo(() => Object.keys(pendingRemovals).length > 0, [pendingRemovals]);

  const restoreShift = useCallback((isoDate: string, shiftId: string) => {
    const pendingKey = toPendingRemovalKey(isoDate, shiftId);

    if (pendingRemovalsRef.current[pendingKey] === undefined) {
      return;
    }

    clearPendingRemoval(pendingKey, pendingRemovalsRef, pendingRemovalToastIdsRef, dismissToast);
    setPendingRemovals({ ...pendingRemovalsRef.current });
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

      clearPendingRemoval(pendingKey, pendingRemovalsRef, pendingRemovalToastIdsRef);
      setPendingRemovals({ ...pendingRemovalsRef.current });
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
  }, []);

  const handleChevronClick = useCallback((direction: 'left' | 'right') => {
    if (!scroller.current) return;

    // Calculate the scroll amount as the viewport width (one day cell)
    const scrollAmount = scroller.current.clientWidth + 1;
    const scrollDistance = direction === 'right' ? scrollAmount : -scrollAmount;

    scroller.current.scrollBy({ left: scrollDistance });
  }, []);

  const tickingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;

    requestAnimationFrame(() => {
      updateChevrons();
      tickingRef.current = false;
    });
  }, [updateChevrons]);

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
        onClick={() => handleChevronClick('left')}
      >
        <span className="material-symbols-outlined">&#xe5cb;</span>
      </button>
      <button
        ref={nextIndicator}
        type="button"
        className="chevron next"
        id="nextBtn"
        aria-label="Scroll to next day"
        onClick={() => handleChevronClick('right')}
      >
        <span className="material-symbols-outlined">&#xe5cc;</span>
      </button>
      <div ref={scroller} id="confirm-card__grid" className="confirm-card__grid" aria-label="Scanned weekly schedule">
        {displayWeekDays.map((day) =>
          <CalendarDayCard
            key={day.isoDate}
            day={day}
            onEditShift={openShiftEditor}
            onRemoveShift={removeShift}
            canRemoveShift={!hasPendingRemovals}
            onAddShift={addNewShift}
          />)
        }
      </div>
    </>
  );
};

export default CalendarWeekList;
