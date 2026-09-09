import React from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import {
  loadAnalysisResponse,
  loadDraftConfirmation,
} from '@/services/schedule-analysis';
import './ConfirmPage.css';

const formatShiftSummary = (date: string, startTime: string, endTime: string) => `${date} ${startTime} - ${endTime}`;

const ConfirmPage = () => {
  const navigate = useNavigate();
  const draftConfirmation = loadDraftConfirmation();
  const analysisResponse = draftConfirmation ? null : loadAnalysisResponse();
  const shifts = draftConfirmation?.shifts ?? analysisResponse?.shifts ?? [];

  return (
    <main className="confirm-page">
      <section className="confirm-card" aria-labelledby="confirm-title">
        <p className="confirm-card__eyebrow">Review and confirm</p>
        <h1 id="confirm-title">Review your extracted shifts</h1>

        {shifts.length > 0 ? (
          <>
            <p className="confirm-card__intro">
              {draftConfirmation
                ? 'Your saved review was restored from local storage.'
                : 'Your extracted shifts were restored from local storage.'}
            </p>

            <div className="confirm-card__summary" aria-label="Extracted shifts summary">
              <p>{shifts.length} extracted shift{shifts.length === 1 ? '' : 's'} ready for review.</p>
              <ul>
                {shifts.map((shift) => (
                  <li key={formatShiftSummary(shift.date, shift.startTime, shift.endTime)}>
                    {formatShiftSummary(shift.date, shift.startTime, shift.endTime)}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="confirm-card__intro">No saved review was found. Start over from capture to continue.</p>
        )}

        <div className="confirm-card__actions">
          <ActionButton variant="primary" onClick={() => {
            // TODO
          }}>
            Create Events
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {
            // TODO
          }}>
            Cancel
          </ActionButton>
        </div>
      </section>
    </main>
  );
};

export default ConfirmPage;
