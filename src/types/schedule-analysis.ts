export interface CapturedSchedulePhoto {
  base64: string;
  mimeType: string;
  fileName: string;
  savedAt: string;
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
