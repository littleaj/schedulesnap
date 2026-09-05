import React from 'react';
import FeatureCard from '../../molecules/FeatureCard';
import './HomePage.css';
import ActionButton from '../../atoms/ActionButton/ActionButton';

const HomePage = () => {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">A smarter way to capture shifts</p>
          <h1>ScheduleSnap</h1>
          <p className="tagline">Snap. Scan. Sync.</p>
          <p className="description">
            Turn a photo of a work schedule into clean, confirmed calendar events in a few taps.
          </p>

          <div className="hero__actions">
            <ActionButton variant="primary">Get started</ActionButton>
            <ActionButton variant="secondary">Learn more</ActionButton>
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
        <FeatureCard icon="📸" heading="Photo to schedule">
          <p>Upload a shift image and let the app read the details from the photo.</p>
        </FeatureCard>

        <FeatureCard icon="✅" heading="Review before syncing">
          <p>Check the extracted shifts and fix anything uncertain before saving.</p>
        </FeatureCard>

        <FeatureCard icon="🗓️" heading="Google Calendar ready">
          <p>Write the approved entries directly to your chosen calendar in seconds.</p>
        </FeatureCard>
      </section>
    </main>
  );
};

export default HomePage;
