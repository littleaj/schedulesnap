import { loadAnalysisResponse, loadCapturedSchedulePhoto, loadDraftConfirmation } from './schedule-analysis';
import type { AnalysisFlowResumeTarget } from '@/types/schedule-analysis';

export const getAnalysisFlowResumeTarget = (): AnalysisFlowResumeTarget | null => {
  if (loadDraftConfirmation()) {
    return {
      route: '/confirm',
      description: 'an in-progress review',
    };
  }

  if (loadAnalysisResponse()) {
    return {
      route: '/confirm',
      description: 'a saved analysis result',
    };
  }

  if (loadCapturedSchedulePhoto()) {
    return {
      route: '/analyze',
      description: 'a saved schedule photo',
    };
  }

  return null;
};
