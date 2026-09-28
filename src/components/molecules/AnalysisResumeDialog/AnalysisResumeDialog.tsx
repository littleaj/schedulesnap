import React from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './AnalysisResumeDialog.css';
import type { AnalysisFlowResumeTarget } from '@/types/schedule-analysis';

interface AnalysisResumeDialogProps {
  resumeTarget: AnalysisFlowResumeTarget;
  onContinue: () => void;
  onDiscard: () => void;
}

const AnalysisResumeDialog = ({ resumeTarget, onContinue, onDiscard }: AnalysisResumeDialogProps) => {
  return (
    <div className="analysis-resume-dialog__backdrop">
      <dialog
        className="analysis-resume-dialog"
        aria-modal="true"
        aria-labelledby="analysis-resume-title"
        open
      >
        <p className="eyebrow">Continue your workflow</p>
        <h1 id="analysis-resume-title">Continue where you left off?</h1>
        <p className="analysis-resume-dialog__intro">
          We found {resumeTarget.description}. You can pick up from there or clear the saved data and start fresh.
        </p>

        <div className="analysis-resume-dialog__actions">
          <ActionButton variant="primary" onClick={onContinue}>
            Continue
          </ActionButton>
          <ActionButton variant="secondary" onClick={onDiscard}>
            Start fresh
          </ActionButton>
        </div>
      </dialog>
    </div>
  );
};

export default AnalysisResumeDialog;
