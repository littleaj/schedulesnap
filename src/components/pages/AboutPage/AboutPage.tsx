import React from 'react';
import { Link } from 'react-router';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <main className="about-page">
      <section className="about-page__header">
        <p className="eyebrow">About</p>
        <h1>About Schedule Snap</h1>
        <p className="intro">
          I was tired of entering my schedule into Google Calendar, most of the time
          from a picture of the schedule. I knew this could be done automatically, so
          I made this app.
        </p>
      </section>

      <section className="about-page__story" aria-label="Story behind the app">
        <div className="story-card">
          <h2>The idea</h2>
          <p>
            I wanted a faster, less frustrating way to turn weekly schedules into
            calendar events. The workflow was repetitive: take a photo, read the text,
            re-enter the details, and double-check everything before it was useful.
          </p>
        </div>

        <div className="story-card">
          <h2>The goal</h2>
          <p>
            ScheduleSnap is designed to take that manual work out of the process. The app
            reads a schedule image, extracts the likely shifts, and lets the user review
            every entry before it gets added to Google Calendar.
          </p>
        </div>
      </section>

      <section className="about-page__panel" aria-labelledby="tech-stack-heading">
        <h2 id="tech-stack-heading">Tech stack</h2>
        <div className="tech-stack">
          <div>
            <h3>Frontend</h3>
            <p>React + TypeScript + Vite</p>
          </div>
          <div>
            <h3>Routing</h3>
            <p>React Router</p>
          </div>
          <div>
            <h3>AI extraction</h3>
            <p>Firebase AI Logic + Gemini</p>
          </div>
          <div>
            <h3>Auth & storage</h3>
            <p>Firebase Auth, Firestore, Google Calendar API</p>
          </div>
          <div>
            <h3>Styling</h3>
            <p>Custom CSS with Material-inspired design tokens</p>
          </div>
        </div>
      </section>

      <section className="about-page__links" aria-label="External links">
        <a href="https://arthurjlittle.com" target="_blank" rel="noreferrer">
          Arthur J. Little
        </a>
        <a href="https://github.com/littleaj" target="_blank" rel="noreferrer">
          GitHub page (TBD)
        </a>
      </section>

      <aside className="about-page__aside">
        <Link to="/help">Looking for help?</Link>
      </aside>
    </main>
  );
};

export default AboutPage;
