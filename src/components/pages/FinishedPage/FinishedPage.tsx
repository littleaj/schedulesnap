import React from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import './FinishedPage.css';

const FinishedPage = () => {
  const navigate = useNavigate();

  return (
    <main className="finished-page">
      <section className="finished-card" aria-labelledby="finished-title">
        <p className="finished-card__eyebrow">Schedule Synced</p>
        <h1 id="finished-title">All set!</h1>
        <p className="finished-card__intro">
          Your shifts were created in Google Calendar and are ready to view.
        </p>

        <div className="finished-card__actions">
          <ActionButton variant="primary" onClick={() => navigate('/capture')}>
            Add Another Schedule
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => navigate('/')}>
            Back Home
          </ActionButton>
        </div>
      </section>
    </main>
  );
};

export default FinishedPage;
