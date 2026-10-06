import type { EditableShift, WeekDay } from "@/types/shift-display";
import { resolveShiftDateTimes } from "@/utils/mappers";

export interface WeekValidationState {
  hasEditableShift: boolean;
  hasInvalidShift: boolean;
}

const hasRequiredShiftValues = (shift: EditableShift) => {
  const eventName = (shift.eventName ?? shift.role ?? '').trim();
  return eventName.length > 0 && Boolean(shift.startTime?.trim()) && Boolean(shift.endTime?.trim());
};

export const isShiftValid = (shift: EditableShift) => {
  if (shift.isPlaceholder) {
    return true;
  }

  if (!hasRequiredShiftValues(shift)) {
    return false;
  }

  const dateTimes = resolveShiftDateTimes(shift.date, shift.startTime, shift.endTime);
  return Boolean(dateTimes && dateTimes.endDateTime > dateTimes.startDateTime);
};

export const getWeekValidationState = (weekDays: WeekDay[]): WeekValidationState => {
  const editableShifts = weekDays.flatMap((day) => day.shifts).filter((shift) => !shift.isPlaceholder);

  return {
    hasEditableShift: editableShifts.length > 0,
    hasInvalidShift: editableShifts.some((shift) => !isShiftValid(shift)),
  };
};
