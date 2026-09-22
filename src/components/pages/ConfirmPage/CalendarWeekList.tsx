import React, { useCallback, useEffect, useState } from "react";
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

  const scroller = document.getElementById('confirm-card__grid');
  const panels = document.querySelectorAll('.confirm-card__day');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const updateChevrons = useCallback(() => {
    if (!scroller || !prevBtn || !nextBtn) return;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const atStart = scroller.scrollLeft <= 1;
    const atEnd = scroller.scrollLeft >= maxScroll - 1;

    prevBtn.classList.toggle('visible', !atStart);
    nextBtn.classList.toggle('visible', !atEnd);
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
    scroller?.addEventListener('scroll', handleScroll);
    return () => {
      scroller?.removeEventListener('scroll', handleScroll);
    };
  }, [scroller, handleScroll]);

  const goToPanel = (index: number) => {
    if (!scroller) return;
    scroller.scrollTo({
      left: index * scroller.clientWidth,
      behavior: 'smooth',
    });
  };

  const goToPrevPanel = () => {
    if (!scroller) return;
    const index = Math.max(0, Math.round(scroller.scrollLeft / scroller.clientWidth) - 1);
    goToPanel(index);
  };

  const goToNextPanel = () => {
    if (!scroller || !panels) return;
    const index = Math.min(panels.length - 1, Math.round(scroller.scrollLeft / scroller.clientWidth) + 1);
    goToPanel(index);
  };

  useEffect(() => {
    if (!prevBtn || !nextBtn) return;
    prevBtn.addEventListener('click', goToPrevPanel);
    nextBtn.addEventListener('click', goToNextPanel);
    return () => {
      prevBtn.removeEventListener('click', goToPrevPanel);
      nextBtn.removeEventListener('click', goToNextPanel);
    };
  }, [prevBtn, nextBtn, goToPrevPanel, goToNextPanel]);

  useEffect(() => {
    window.addEventListener('resize', updateChevrons);
    updateChevrons();
    return () => {
      window.removeEventListener('resize', updateChevrons);
    };
  }, [updateChevrons]);

  return (
    <>
      <button className="chevron prev" id="prevBtn" aria-label="Previous day">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button className="chevron next" id="nextBtn" aria-label="Next day">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <div id="confirm-card__grid" className="confirm-card__grid" aria-label="Scanned weekly schedule">
        {weekDays.map((day) =>
          <CalendarDayCard key={day.isoDate} day={day} updateShiftField={updateShiftField} />)
        }
      </div>
    </>
  );
};

export default CalendarWeekList;
