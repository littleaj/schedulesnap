import type { ScheduleAnalysisShift } from "@/types/schedule-analysis";
import type { WeekDay, EditableShift } from "@/types/shift-display";
import { getWeekStartDate } from "@/utils/time-utils";
import { toLocalDate, toLocalIsoDate, formatWeekday, formatMonthDay, formatTime } from "./formatting";

export const buildWeekDays = (
  shifts: ScheduleAnalysisShift[],
): WeekDay[] => {
  const firstShiftDate = shifts[0] ? toLocalDate(shifts[0].date) : null;
  const weekStart = firstShiftDate ? getWeekStartDate(firstShiftDate) : null;
  const groupedShifts = new Map<string, EditableShift[]>();

  for (const shift of shifts) {
    const dayShifts = groupedShifts.get(shift.date) ?? [];
    dayShifts.push({
      ...shift,
      eventName: shift.role ?? '',
      id: formatShiftKey(shift),
      isPlaceholder: false,
    });
    groupedShifts.set(shift.date, dayShifts);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = weekStart ? new Date(weekStart) : new Date();
    if (weekStart) {
      dayDate.setDate(weekStart.getDate() + index);
    }

    const isoDate = toLocalIsoDate(dayDate);

    const weekday: WeekDay = {
      isoDate,
      weekday: formatWeekday(dayDate),
      monthDay: formatMonthDay(dayDate),
      shifts: groupedShifts.get(isoDate)?.map((shift) => ({
        ...shift,
        startTime: shift.startTime,
        endTime: shift.endTime,
        id: formatShiftKey(shift),
        isPlaceholder: false
      })) ?? [
          {
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
          },
        ],
    };

    return weekday;
  });
};

export const formatShiftKey = ({ date, startTime, endTime, role, location }: ScheduleAnalysisShift) => {
  return `${date}-${startTime}-${endTime}-${role ?? ''}-${location ?? ''}`;
};

