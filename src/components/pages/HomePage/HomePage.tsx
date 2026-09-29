import React from 'react';
import { useNavigate } from 'react-router';
import FeatureCard from '@/components/molecules/FeatureCard';
import ActionButton from '@/components/atoms/ActionButton';
import './HomePage.css';
import PageContent from '@/components/templates/PageContent';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <PageContent className="home-page">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">An easy way to save your shifts</p>
          <h1>ScheduleSnap</h1>
          <p className="tagline">Snap. Scan. Sync.</p>
          <p className="description">
            Turn a photo of a work schedule into calendar events in a few taps.
          </p>

          <div className="hero__actions">
            <ActionButton variant="primary" onClick={() => navigate('/capture')}>
              Get started
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => navigate('/about')}>
              Learn more
            </ActionButton>
          </div>
        </div>

        <div className="hero__visual" aria-label="ScheduleSnap preview">
          <img
            src="/assets/hero-visual.svg"
            alt="ScheduleSnap preview"
            className="hero-illustration"
          />
        </div>
      </section>

      <section className="feature-grid" aria-label="Key features">
        <FeatureCard icon="📸" heading="Snap a photo" className="tertiary">
          <p>Upload a picture of your schedule and let the app read the details from the photo.</p>
        </FeatureCard>

        <FeatureCard icon="✅" heading="Review" className="secondary">
          <p>Check the shifts it scanned and make adjustments before saving.</p>
        </FeatureCard>

        <FeatureCard icon="🗓️" heading="Sync to Google Calendar" className="primary">
          <p>Create calendar events from your schedule in seconds.</p>
        </FeatureCard>
      </section>
    </PageContent>
  );
};

export default HomePage;
