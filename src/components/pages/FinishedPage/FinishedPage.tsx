import React from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import './FinishedPage.css';
import PageContent from '@/components/templates/PageContent';
import { Card } from '@/components/atoms/Card';

const FinishedPage = () => {
  const navigate = useNavigate();

  return (
    <PageContent className="finished-page">
      <Card className="finished-card" aria-labelledby="finished-title">
        <p className="eyebrow">Schedule Synced</p>
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
      </Card>
    </PageContent>
  );
};

export default FinishedPage;
