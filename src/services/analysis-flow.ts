import { loadAnalysisResponse, loadCapturedSchedulePhoto, loadDraftConfirmation } from './schedule-analysis';
import type { AnalysisFlowResumeTarget } from '@/types/schedule-analysis';

export const getAnalysisFlowResumeTarget = (uid: string): AnalysisFlowResumeTarget | null => {
  if (loadDraftConfirmation(uid)) {
    return {
      route: '/confirm',
      description: 'an in-progress review',
    };
  }

  if (loadAnalysisResponse(uid)) {
    return {
      route: '/confirm',
      description: 'a saved analysis result',
    };
  }

  if (loadCapturedSchedulePhoto(uid)) {
    return {
      route: '/analyze',
      description: 'a saved schedule photo',
    };
  }

  return null;
};
