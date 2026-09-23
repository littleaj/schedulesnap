import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalendarDayCard from "./CalendarDayCard";
import type { WeekDay } from "@/types/shift-display";

interface CalendarWeekListProps {
  shifts: WeekDay[];
  onChange: (weekDays: WeekDay[]) => void;
}

const CalendarWeekList = ({ shifts, onChange }: CalendarWeekListProps) => {
  const [weekDays, setWeekDays] = useState<WeekDay[]>(shifts);

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
        {weekDays.map((day) =>
          <CalendarDayCard key={day.isoDate} day={day} updateShiftField={updateShiftField} />)
        }
      </div>
    </>
  );
};

export default CalendarWeekList;
