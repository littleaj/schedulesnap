import { getApp } from 'firebase/app';
import { getAI, getGenerativeModel } from 'firebase/ai';
import aiResponseSchema from '@/ai-response-schema.json';
import type {
  CapturedSchedulePhoto,
  DraftConfirmation,
  ScheduleAnalysisResponse,
  ScheduleAnalysisShift,
} from '@/types/schedule-analysis';

const CAPTURED_PHOTO_STORAGE_KEY = 'schedulesnap:captured-photo';
const ANALYSIS_RESPONSE_STORAGE_KEY = 'schedulesnap:analysis-response';
const DRAFT_CONFIRMATION_STORAGE_KEY = 'schedulesnap:draft-confirmation';
const DEFAULT_MAX_DIMENSION = 1024;
const DEFAULT_JPEG_QUALITY = 0.8;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isShift = (value: unknown): value is ScheduleAnalysisShift => {
  if (!isRecord(value)) {
    return false;
  }

  return isString(value.date)
    && isString(value.startTime)
    && isString(value.endTime)
    && isNumber(value.confidence)
    && isString(value.rawText)
    && (value.role === undefined || isString(value.role))
    && (value.location === undefined || isString(value.location));
};

const isAnalysisResponse = (value: unknown): value is ScheduleAnalysisResponse => {
  if (!isRecord(value)) {
    return false;
  }

  return (value.scheduleOwnerGuess === undefined || isString(value.scheduleOwnerGuess))
    && Array.isArray(value.warnings)
    && value.warnings.every(isString)
    && Array.isArray(value.shifts)
    && value.shifts.every(isShift);
};

const isDraftConfirmation = (value: unknown): value is DraftConfirmation => {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.shifts)
    && value.shifts.every(isShift)
    && isString(value.selectedCalendarId);
};

const canUseLocalStorage = () => window?.localStorage !== undefined;

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result === 'string') {
      resolve(reader.result);
      return;
    }

    reject(new Error('Unable to read the selected photo.'));
  };

  reader.onerror = () => {
    reject(new Error('Unable to read the selected photo.'));
  };

  reader.readAsDataURL(file);
});

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();

  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Unable to load the selected photo.'));
  image.src = src;
});

export const calculateResizedDimensions = (width: number, height: number, maxDimension = DEFAULT_MAX_DIMENSION) => {
  const largestSide = Math.max(width, height);

  if (largestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / largestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

export const saveCapturedSchedulePhoto = (photo: CapturedSchedulePhoto) => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(CAPTURED_PHOTO_STORAGE_KEY, JSON.stringify(photo));
};

export const loadCapturedSchedulePhoto = (): CapturedSchedulePhoto | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(CAPTURED_PHOTO_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!isRecord(parsedValue) || !isString(parsedValue.base64) || !isString(parsedValue.mimeType) || !isString(parsedValue.fileName)) {
      return null;
    }

    return {
      base64: parsedValue.base64,
      mimeType: parsedValue.mimeType,
      fileName: parsedValue.fileName,
    };
  } catch {
    return null;
  }
};

export const saveAnalysisResponse = (response: ScheduleAnalysisResponse) => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYSIS_RESPONSE_STORAGE_KEY, JSON.stringify(response));
};

export const loadAnalysisResponse = (): ScheduleAnalysisResponse | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(ANALYSIS_RESPONSE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    return isAnalysisResponse(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

export const saveDraftConfirmation = (draft: DraftConfirmation) => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(DRAFT_CONFIRMATION_STORAGE_KEY, JSON.stringify(draft));
};

export const loadDraftConfirmation = (): DraftConfirmation | null => {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(DRAFT_CONFIRMATION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    return isDraftConfirmation(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

export const clearAnalysisFlowCache = () => {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(CAPTURED_PHOTO_STORAGE_KEY);
  window.localStorage.removeItem(ANALYSIS_RESPONSE_STORAGE_KEY);
  window.localStorage.removeItem(DRAFT_CONFIRMATION_STORAGE_KEY);
};

export const buildAnalysisPrompt = (targetName: string, todayIso: string) => `You are extracting a work schedule from a photo of a printed or handwritten schedule, calendar, or whiteboard.

Rules:
- Return ONLY JSON matching the provided schema. No prose, no markdown fences.
- Today's date is ${todayIso}. Use this to resolve relative dates and infer missing years.
- If the schedule shows multiple employees' names, extract only shifts belonging to: "${targetName}". If you can't confidently identify which rows belong to this person, extract all shifts and set scheduleOwnerGuess to your best guess, and add a warning.
- Times are often ambiguous (e.g. "9-5" with no am/pm). Infer using context (typical work hours), but if genuinely ambiguous, lower confidence and note it in a warning.
- Convert all times to 24-hour HH:mm format.
- If the year isn't shown, assume the current year unless the month/day would already be in the past relative to today — then assume next year. Note this assumption in warnings.
- Never invent shifts that aren't visible in the image. If the image is blurry or a section is unreadable, omit that shift and add a warning describing what was skipped.`;

export const parseAnalysisResponse = (responseText: string): ScheduleAnalysisResponse => {
  const parsedValue: unknown = JSON.parse(responseText.trim());

  if (!isAnalysisResponse(parsedValue)) {
    throw new Error('The analysis response did not match the expected schema.');
  }

  return {
    scheduleOwnerGuess: parsedValue.scheduleOwnerGuess,
    warnings: parsedValue.warnings,
    shifts: parsedValue.shifts,
  };
};

export const resizeSchedulePhoto = async (
  file: File,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<CapturedSchedulePhoto> => {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const resizedDimensions = calculateResizedDimensions(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    options.maxDimension ?? DEFAULT_MAX_DIMENSION,
  );

  const canvas = document.createElement('canvas');
  canvas.width = resizedDimensions.width;
  canvas.height = resizedDimensions.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to prepare the selected photo.');
  }

  context.drawImage(image, 0, 0, resizedDimensions.width, resizedDimensions.height);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', options.quality ?? DEFAULT_JPEG_QUALITY);
  const base64 = jpegDataUrl.split(',')[1];

  if (!base64) {
    throw new Error('Unable to prepare the selected photo.');
  }

  return {
    base64,
    mimeType: 'image/jpeg',
    fileName: file.name,
  };
};

export const analyzeSchedulePhoto = async (
  photo: CapturedSchedulePhoto,
  targetName: string,
  todayIso = new Date().toISOString().slice(0, 10),
) => {
  const ai = getAI(getApp());
  const model = getGenerativeModel(ai, { model: 'gemini-3.5-flash-lite' });

   try {
      const result = await model.generateContent({
        systemInstruction: buildAnalysisPrompt(targetName, todayIso),
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: photo.base64,
                  mimeType: photo.mimeType,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: aiResponseSchema,
        },
      });
      const parsedResponse = parseAnalysisResponse(result.response.text());
      saveAnalysisResponse(parsedResponse);
      return parsedResponse;
   } catch (error) {
     throw new Error(`Failed to analyze schedule photo: ${error}`);
   }
};
