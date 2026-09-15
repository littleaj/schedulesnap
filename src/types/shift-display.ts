import type { ScheduleAnalysisShift } from "./schedule-analysis";


export interface EditableShift extends ScheduleAnalysisShift {
  eventName?: string;
  id: string;
  isPlaceholder: boolean;
}

export interface WeekDay {
  isoDate: string;
  weekday: string;
  monthDay: string;
  shifts: EditableShift[];
}

