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
  const panels = document.querySelectorAll('.confirm-card__day');
  const prevBtn = useRef<HTMLButtonElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const updateChevrons = useCallback(() => {
    if (!scroller.current || !prevBtn.current || !nextBtn.current) return;
    const maxScroll = scroller.current.scrollWidth - scroller.current.clientWidth;
    const atStart = scroller.current.scrollLeft <= 1;
    const atEnd = scroller.current.scrollLeft >= maxScroll - 1;

    prevBtn.current.classList.toggle('visible', !atStart);
    nextBtn.current.classList.toggle('visible', !atEnd);
  }, [scroller, prevBtn, nextBtn]);

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

  const panelWidth = useMemo(() => panels.item(0)?.clientWidth, [panels.item(0)]);
  const goToPanel = (index: number) => {
    if (!scroller.current) return;
    scroller.current.scrollTo({
      left: index * panelWidth,
      behavior: 'smooth',
    });
  };

  const goToPrevPanel = () => {
    if (!scroller.current) return;
    const currentIndex = Math.round(scroller.current.scrollLeft / panelWidth);
    const index = Math.max(0, currentIndex - 1);
    goToPanel(index);
  };

  const goToNextPanel = () => {
    if (!scroller.current || !panels) return;
    const currentIndex = Math.round(scroller.current.scrollLeft / panelWidth);
    const index = Math.min(panels.length - 1, currentIndex + 1);
    goToPanel(index);
  };

  useEffect(() => {
    if (!prevBtn.current || !nextBtn.current) return;
    prevBtn.current.addEventListener('click', goToPrevPanel);
    nextBtn.current.addEventListener('click', goToNextPanel);
    return () => {
      prevBtn.current?.removeEventListener('click', goToPrevPanel);
      nextBtn.current?.removeEventListener('click', goToNextPanel);
    };
  }, [prevBtn.current, nextBtn.current, goToPrevPanel, goToNextPanel]);

  useEffect(() => {
    window.addEventListener('resize', updateChevrons);
    updateChevrons();
    return () => {
      window.removeEventListener('resize', updateChevrons);
    };
  }, [updateChevrons]);

  return (
    <>
      <button ref={prevBtn} className="chevron prev" id="prevBtn" aria-label="Previous day">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button ref={nextBtn} className="chevron next" id="nextBtn" aria-label="Next day">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <div ref={scroller} id="confirm-card__grid" className="confirm-card__grid" aria-label="Scanned weekly schedule">
        {weekDays.map((day) =>
          <CalendarDayCard key={day.isoDate} day={day} updateShiftField={updateShiftField} />)
        }
      </div>
    </>
  );
};

export default CalendarWeekList;
