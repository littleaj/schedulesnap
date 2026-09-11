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

const fakeUid = "fake-uid-analysis-flow";

describe('analysis-flow helper', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('chooses the right resume target for each cached artifact', () => {
    saveCapturedSchedulePhoto(fakeUid, {
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });

    expect(getAnalysisFlowResumeTarget(fakeUid)).toEqual({
      route: '/analyze',
      description: 'a saved schedule photo',
    });

    saveAnalysisResponse(fakeUid, { warnings: [], shifts: [] });

    expect(getAnalysisFlowResumeTarget(fakeUid)).toEqual({
      route: '/confirm',
      description: 'a saved analysis result',
    });

    saveDraftConfirmation(fakeUid, {
      shifts: [],
      selectedCalendarId: 'primary',
    });

    expect(loadCapturedSchedulePhoto(fakeUid)).toEqual({
      base64: 'abc123',
      mimeType: 'image/jpeg',
      fileName: 'schedule.jpg',
    });
    expect(loadAnalysisResponse(fakeUid)).toEqual({ warnings: [], shifts: [] });
    expect(loadDraftConfirmation(fakeUid)).toEqual({
      shifts: [],
      selectedCalendarId: 'primary',
    });
    expect(getAnalysisFlowResumeTarget(fakeUid)).toEqual({
      route: '/confirm',
      description: 'an in-progress review',
    });
  });
});
