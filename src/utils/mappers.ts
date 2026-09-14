import type { GoogleCalendarEvent } from "@/types/google-calendar";
import type { EditableShift } from "@/types/shift-display";
import { convertTo24Hour } from "./time-utils";

export const editableShift2GoogleCalendarEvent = (shift: EditableShift): GoogleCalendarEvent | null => {
  const start24Hour = convertTo24Hour(shift.startTime);
  const end24Hour = convertTo24Hour(shift.endTime);
  const startDateTime = new Date(`${shift.date}T${start24Hour}:00`);
  const endDateTime = new Date(`${shift.date}T${end24Hour}:00`);

  if (!start24Hour || !end24Hour || Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return null;
  }

  return {
    summary: shift.role || shift.location || 'Work Shift',
    location: shift.location || undefined,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    },
  } satisfies GoogleCalendarEvent;
};
