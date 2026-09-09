import { beforeEach, describe, expect, it } from 'vitest';
import { getAnalysisFlowResumeTarget } from './analysis-flow';
import {
  loadAnalysisResponse,
  loadCapturedSchedulePhoto,
  loadDraftConfirmation,
  saveAnalysisResponse,
  saveCapturedSchedulePhoto,
  saveDraftConfirmation,
} from './schedule-analysis';

describe('analysis-flow helper', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('chooses the right resume target for each cached artifact', () => {
    saveCapturedSchedulePhoto({
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });

    expect(getAnalysisFlowResumeTarget()).toEqual({
      route: '/analyze',
      description: 'a saved schedule photo',
    });

    saveAnalysisResponse({ warnings: [], shifts: [] });

    expect(getAnalysisFlowResumeTarget()).toEqual({
      route: '/confirm',
      description: 'a saved analysis result',
    });

    saveDraftConfirmation({
      shifts: [],
      selectedCalendarId: 'primary',
    });

    expect(loadCapturedSchedulePhoto()).toEqual({
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });
    expect(loadAnalysisResponse()).toEqual({ warnings: [], shifts: [] });
    expect(loadDraftConfirmation()).toEqual({
      shifts: [],
      selectedCalendarId: 'primary',
    });
    expect(getAnalysisFlowResumeTarget()).toEqual({
      route: '/confirm',
      description: 'an in-progress review',
    });
  });
});
