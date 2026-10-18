import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildAnalysisPrompt,
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

  it('parses a valid analysis response and rejects invalid data', () => {
    const parsedResponse = parseAnalysisResponse(JSON.stringify({
      scheduleOwnerGuess: 'Alex',
      warnings: ['Year assumed from context'],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          endTime: '17:00',
          boundingBox: {
            x: 100,
            y: 200,
            width: 300,
            height: 120,
          },
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    }));

    expect(parsedResponse.scheduleOwnerGuess).toBe('Alex');
    expect(parsedResponse.shifts).toHaveLength(1);
    expect(parsedResponse.shifts[0]?.boundingBox).toEqual({
      x: 100,
      y: 200,
      width: 300,
      height: 120,
    });

    expect(() => parseAnalysisResponse(JSON.stringify({
      warnings: [],
      shifts: [
        {
          date: '2026-09-05',
          startTime: '09:00',
          confidence: 0.9,
          rawText: 'Sep 5 9:00 AM - 5:00 PM',
        },
      ],
    }))).toThrow(/expected schema/i);
  });

  it('includes bounding box extraction instructions in the analysis prompt', () => {
    const prompt = buildAnalysisPrompt('Alex', '2026-09-01');

    expect(prompt).toMatch(/bounding box/i);
    expect(prompt).toMatch(/0-1000/i);
    expect(prompt).toMatch(/resized/i);
  });

  it('saves and loads cached capture and analysis payloads', () => {
    saveCapturedSchedulePhoto(fakeUid, {
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });

    saveAnalysisResponse(fakeUid, {
      warnings: [],
      shifts: [],
    });

    expect(loadCapturedSchedulePhoto(fakeUid)).toEqual({
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });
    expect(loadAnalysisResponse(fakeUid)).toEqual({ warnings: [], shifts: [] });
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
