import React from 'react';
import { useNavigate } from 'react-router';
import FeatureCard from '@/components/molecules/FeatureCard';
import ActionButton from '@/components/atoms/ActionButton';
import './HomePage.css';
import PageContent from '@/components/templates/PageContent';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="hero__visual"></div>
      <PageContent className="home-page">
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">An easy way to save your schedule</p>
            <h1 className="title">Schedule<span className="bold">Snap</span></h1>
            <p className="tagline">Snap. Scan. Sync.</p>
            <p className="description">
              Turn a picture of your work schedule into calendar events in a few taps.
            </p>

            <div className="hero__actions">
              <ActionButton variant="primary" onClick={() => navigate('/capture')}>
                Get Started
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => navigate('/about')}>
                Learn More
              </ActionButton>
            </div>
          </div>

        </section>

        <section className="feature-grid" aria-label="Key features">
          <FeatureCard icon="📸" heading="Snap a Picture">
            <p>First, take a picture of your schedule and upload it to the app.</p>
          </FeatureCard>

          <FeatureCard icon="✅" heading="Scan & Review">
            <p>Then, let the AI scan your schedule and extract the details for your review.</p>
          </FeatureCard>

          <FeatureCard icon="🗓️" heading="Sync to Google Calendar">
            <p>Finally, sync the reviewed shifts to your calendar in seconds.</p>
          </FeatureCard>
        </section>
      </PageContent>
    </>
  );
};

export default HomePage;
