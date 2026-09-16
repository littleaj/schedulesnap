export interface CapturedSchedulePhoto {
  base64: string;
  mimeType: string;
  fileName: string;
}

export interface ScheduleAnalysisShift {
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
  location?: string;
  confidence: number;
  rawText: string;
}

export interface ScheduleAnalysisResponse {
  scheduleOwnerGuess?: string;
  warnings: string[];
  shifts: ScheduleAnalysisShift[];
}

export interface DraftConfirmation {
  // FIXME: change this type to EditableShift[]
  shifts: ScheduleAnalysisShift[];
  selectedCalendarId: string;
}

export interface AnalysisFlowResumeTarget {
  route: '/analyze' | '/confirm';
  description: string;
}
