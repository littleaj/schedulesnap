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
          <div className="phone-card">
            <div className="phone-card__header">
              <span className="dot dot--red" />
              <span className="dot dot--amber" />
              <span className="dot dot--green" />
            </div>

            <div className="schedule-preview">
              <div className="schedule-preview__title">This week</div>
              <div className="schedule-preview__row">
                <span>Mon</span>
                <strong>9:00–17:00</strong>
              </div>
              <div className="schedule-preview__row">
                <span>Tue</span>
                <strong>8:30–16:30</strong>
              </div>
              <div className="schedule-preview__row">
                <span>Wed</span>
                <strong>10:00–18:00</strong>
              </div>
            </div>
          </div>
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
