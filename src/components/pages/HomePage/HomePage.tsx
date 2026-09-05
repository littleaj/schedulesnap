import React from 'react';
import Card from '../../atoms/Card';
import './HomePage.css';

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
            <button type="button">Get started</button>
            <button type="button" className="secondary">
              Learn more
            </button>
          </div>
        </div>

        <div className="hero__visual" aria-label="ScheduleSnap preview">
          <img
            src="/src/components/pages/HomePage/hero-visual.svg"
            alt="ScheduleSnap preview"
            className="hero-illustration"
          />
        </div>
      </section>

      <section className="feature-grid" aria-label="Key features">
        <Card>
          <span className="feature-card__icon">📸</span>
          <h2>Photo to schedule</h2>
          <p>Upload a shift image and let the app read the details from the photo.</p>
        </Card>

        <Card>
          <span className="feature-card__icon">✅</span>
          <h2>Review before syncing</h2>
          <p>Check the extracted shifts and fix anything uncertain before saving.</p>
        </Card>

        <Card>
          <span className="feature-card__icon">🗓️</span>
          <h2>Google Calendar ready</h2>
          <p>Write the approved entries directly to your chosen calendar in seconds.</p>
        </Card>
      </section>
    </main>
  );
};

export default HomePage;
