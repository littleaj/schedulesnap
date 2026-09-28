import React from 'react';
import { useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import './HelpPage.css';
import { Card } from '@/components/atoms/Card/Card';
import PageContent from '@/components/templates/PageContent/PageContent';

const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <PageContent className="help-page">
      <section className="help-page__header">
        <p className="eyebrow">Support</p>
        <h1>Help & FAQs</h1>
        <p className="intro">
          ScheduleSnap turns a photo of your schedule into ready-to-review shift entries.
          Here is the quickest way to get the results you expect.
        </p>
      </section>

      <section className="help-page__grid" aria-label="How it works">
        <Card className="help-card">
          <span className="help-card__icon" aria-hidden="true">📸</span>
          <h2>How it works</h2>
          <ol>
            <li>Capture a clear image of your schedule.</li>
            <li>Review the detected shifts before saving anything.</li>
            <li>Approve the entries and send them to Google Calendar.</li>
          </ol>
        </Card>

        <Card className="help-card">
          <span className="help-card__icon" aria-hidden="true">💡</span>
          <h2>Best results</h2>
          <ul>
            <li>Take the photo in good light and keep the schedule flat.</li>
            <li>Make sure the text is easy to read and not cut off.</li>
            <li>Check the extracted times and names before confirming.</li>
          </ul>
        </Card>

        <Card className="help-card">
          <span className="help-card__icon" aria-hidden="true">🧭</span>
          <h2>Common fixes</h2>
          <ul>
            <li>Retake the photo if the app missed a shift or date.</li>
            <li>Edit any incorrect values on the review screen.</li>
            <li>Use Settings to update your default calendar and reminder preferences.</li>
          </ul>
        </Card>
      </section>

      <section className="help-page__steps" aria-label="Quick start steps">
        <h2>Quick start</h2>
        <div className="step-list">
          <div className="step-item">
            <span className="step-item__number">1</span>
            <div>
              <h3>Capture your schedule</h3>
              <p>Open the app and upload a photo from your phone or device.</p>
            </div>
          </div>

          <div className="step-item">
            <span className="step-item__number">2</span>
            <div>
              <h3>Review your shifts</h3>
              <p>Check the names, times, and any conflicts before you confirm.</p>
            </div>
          </div>

          <div className="step-item">
            <span className="step-item__number">3</span>
            <div>
              <h3>Send to calendar</h3>
              <p>Approve the final entries and they’ll be added to your selected calendar.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="help-page__actions">
        <ActionButton variant="primary" onClick={() => navigate('/capture')}>
          Get started
        </ActionButton>
      </section>
    </PageContent>
  );
};

export default HelpPage;
