import React, { useCallback, useState } from "react";
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
  }, []);

  return (
    <ul className="confirm-card__grid" aria-label="Scanned weekly schedule">
      {weekDays.map((day) =>
        <CalendarDayCard key={day.isoDate} day={day} updateShiftField={updateShiftField} />)
      }
    </ul>
  );
};

export default CalendarWeekList;
