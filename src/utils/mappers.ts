import type { GoogleCalendarEvent } from "@/types/google-calendar";
import type { EditableShift } from "@/types/shift-display";
import { convertTo24Hour } from "./time-utils";

export const combineDateTime = (date: string, time: string): Date | null => {
  const normalizedTime = convertTo24Hour(time);
  if (!date?.trim() || !normalizedTime?.trim()) {
    return null;
  }

  const dateTime = new Date(`${date}T${normalizedTime}:00`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

export const resolveShiftDateTimes = (date: string, startTime: string, endTime: string) => {
  const startDateTime = combineDateTime(date, startTime);
  const rawEndDateTime = combineDateTime(date, endTime);

  if (!startDateTime || !rawEndDateTime) {
    return null;
  }

  const endDateTime = new Date(rawEndDateTime);
  const isPotentialOvernight = endDateTime <= startDateTime && startDateTime.getHours() >= 12 && endDateTime.getHours() < 12;
  if (isPotentialOvernight) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return { startDateTime, endDateTime };
};

export const editableShift2GoogleCalendarEvent = (shift: EditableShift): GoogleCalendarEvent | null => {
  const dateTimes = resolveShiftDateTimes(shift.date, shift.startTime, shift.endTime);
  if (!dateTimes || dateTimes.endDateTime <= dateTimes.startDateTime) {
    return null;
  }

  return {
    summary: shift.eventName || shift.role || shift.location || 'Work Shift',
    location: shift.location || undefined,
    start: {
      dateTime: dateTimes.startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    },
    end: {
      dateTime: dateTimes.endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    },
  } satisfies GoogleCalendarEvent;
};
