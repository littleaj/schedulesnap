export interface CapturedSchedulePhoto {
  base64: string;
  mimeType: string;
  fileName: string;
}

export interface ShiftBoundingBox {
  /**
   * Gemini returns these values normalized to a 0-1000 scale (not pixels), relative to
   * the resized image sent to /analyze. Convert to pixel coordinates at render time.
   */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScheduleAnalysisShift {
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
  location?: string;
  boundingBox?: ShiftBoundingBox;
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
