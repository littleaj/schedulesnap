import React from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import './AnalysisPage.css';

const AnalysisPage = () => {
  const navigate = useNavigate();

  return (
    <main className="analysis-page">
      <section className="analysis-card" aria-labelledby="analysis-title" aria-live="polite">
        <p className="analysis-card__eyebrow">AI review</p>
        <h1 id="analysis-title">Analyzing your schedule</h1>

        <div className="analysis-card__status" role="status" aria-live="polite">
          <div className="analysis-card__spinner" aria-hidden="true" />
          <p>Reading your schedule photo and extracting shifts...</p>
        </div>

        <div className="analysis-card__details">
          <p>
            ScheduleSnap is checking the image and preparing the extracted shift list for your review.
          </p>
        </div>

        <div className="analysis-card__actions">

          <ActionButton variant="primary" onClick={() => navigate('/confirm')}>
            Continue to review
          </ActionButton>
        </div>
      </section>
    </main>
  );
};

export default AnalysisPage;
