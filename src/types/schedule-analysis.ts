export interface CapturedSchedulePhoto {
  base64: string;
  mimeType: string;
  fileName: string;
}

/**
 * Bounding box coordinates normalized to a 0-1000 scale relative to the image dimensions.
 * For example, xMin=0, yMin=0, xMax=1000, yMax=1000 represents the entire image.
 * Note: Coordinates are relative to the resized image (max dimension 1024px), not the original.
 */
export interface BoundingBox {
  /** Minimum X coordinate (0-1000) */
  xMin: number;
  /** Minimum Y coordinate (0-1000) */
  yMin: number;
  /** Maximum X coordinate (0-1000) */
  xMax: number;
  /** Maximum Y coordinate (0-1000) */
  yMax: number;
}

export interface ScheduleAnalysisShift {
  date: string;
  startTime: string;
  endTime: string;
  role?: string;
  location?: string;
  confidence: number;
  rawText: string;
  /**
   * Bounding box locating this shift on the source image.
   * Coordinates are normalized to 0-1000 scale and relative to the resized image.
   */
  boundingBox: BoundingBox;
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
