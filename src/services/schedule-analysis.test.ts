import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAnalysisFlowCache,
  calculateResizedDimensions,
  loadDraftConfirmation,
  loadAnalysisResponse,
  loadCapturedSchedulePhoto,
  parseAnalysisResponse,
  saveDraftConfirmation,
  saveAnalysisResponse,
  saveCapturedSchedulePhoto,
} from './schedule-analysis';

const fakeUid = "fake-uid-schedule-analysis";

describe('schedule-analysis services', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('calculates resized dimensions without upscaling smaller images', () => {
    expect(calculateResizedDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('calculates resized dimensions for larger images', () => {
    expect(calculateResizedDimensions(2048, 1024, 1024)).toEqual({ width: 1024, height: 512 });
  });

  it('parses a valid analysis response with bounding boxes', () => {
    const parsedResponse = parseAnalysisResponse(JSON.stringify({
      scheduleOwnerGuess: 'Alex',
      warnings: ['Year assumed from context'],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
          boundingBox: {
            xMin: 100,
            yMin: 200,
            xMax: 400,
            yMax: 300,
          },
        },
      ],
    }));

    expect(parsedResponse.scheduleOwnerGuess).toBe('Alex');
    expect(parsedResponse.shifts).toHaveLength(1);
    expect(parsedResponse.shifts[0].boundingBox).toEqual({
      xMin: 100,
      yMin: 200,
      xMax: 400,
      yMax: 300,
    });
  });

  it('rejects shifts without bounding boxes', () => {
    expect(() => parseAnalysisResponse(JSON.stringify({
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    }))).toThrow(/expected schema/i);
  });

  it('rejects bounding boxes with missing coordinates', () => {
    expect(() => parseAnalysisResponse(JSON.stringify({
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
          boundingBox: {
            xMin: 100,
            yMin: 200,
            xMax: 400,
            // Missing yMax
          },
        },
      ],
    }))).toThrow(/expected schema/i);
  });

  it('rejects bounding boxes with non-numeric coordinates', () => {
    expect(() => parseAnalysisResponse(JSON.stringify({
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
          boundingBox: {
            xMin: '100',
            yMin: 200,
            xMax: 400,
            yMax: 300,
          },
        },
      ],
    }))).toThrow(/expected schema/i);
  });

  it('saves and loads cached capture and analysis payloads with bounding boxes', () => {
    saveCapturedSchedulePhoto(fakeUid, {
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });

    saveAnalysisResponse(fakeUid, {
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
          boundingBox: {
            xMin: 100,
            yMin: 200,
            xMax: 400,
            yMax: 300,
          },
        },
      ],
    });

    expect(loadCapturedSchedulePhoto(fakeUid)).toEqual({
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });
    
    const loadedResponse = loadAnalysisResponse(fakeUid);
    expect(loadedResponse).toBeDefined();
    expect(loadedResponse?.shifts).toHaveLength(1);
    expect(loadedResponse?.shifts[0].boundingBox).toEqual({
      xMin: 100,
      yMin: 200,
      xMax: 400,
      yMax: 300,
    });
  });

  it('clears all analysis-flow caches together', () => {
    saveCapturedSchedulePhoto(fakeUid, {
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });
    saveAnalysisResponse(fakeUid, { warnings: [], shifts: [] });
    saveDraftConfirmation(fakeUid, { shifts: [], selectedCalendarId: 'primary' });

    clearAnalysisFlowCache(fakeUid);

    expect(loadCapturedSchedulePhoto(fakeUid)).toBeNull();
    expect(loadAnalysisResponse(fakeUid)).toBeNull();
    expect(loadDraftConfirmation(fakeUid)).toBeNull();
  });
});
