import React from 'react';
import { Link } from 'react-router';
import PageContent from '@/components/templates/PageContent';
import './AboutPage.css';
import { Card } from '@/components/atoms/Card';

const AboutPage = () => {
  return (
    <PageContent className="about-page">
      <section className="about-page__header">
        <p className="eyebrow">About</p>
        <h1>About Schedule Snap</h1>
        <p className="about-page__intro">
          I was tired of taking a picture of my schedule and entering it into Google Calendar every week. I knew this could be done automatically, so
          I made this app.
        </p>
      </section>

      <div className="about-page__grid">
        <section className="about-page__story" aria-label="Story behind the app">
          <Card className="story-card">
            <h2>The Goal</h2>
            <p>
              I wanted a faster, less tedious way to turn my weekly schedules into
              calendar events. The workflow was repetitive and consistent:
              <ol>
                <li>Take a photo</li>
                <li>Scan the picture for my shifts</li>
                <li>Enter each one into Google Calendar</li>
                <li>Finally, double-check everything</li>
              </ol>
            </p>
          </Card>

          <Card className="story-card">
            <h2>The Solution</h2>
            <p>
              ScheduleSnap is designed to take the manual work out of the process. The app analyzes the image of your schedule, scans the image for your name, extracts your shifts' details, and finally lets you review and edit each entry before publishing to your Google Calendar.
            </p>
          </Card>
        </section>

        <section className="about-page__links" aria-label="External links">
          <Card className="story-card secondary">
            <h2>More About Me</h2>
            <p>
              <a href="https://arthurjlittle.com" target="_blank" rel="noreferrer">
                ArthurJLittle.com
              </a>
            </p>
          </Card>

          <Card className="story-card secondary">
            <h2>More About This Project</h2>
            <p>
              <a href="https://github.com/littleaj" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </p>
            <p style={{ fontStyle: 'italic', fontSize: '0.9em' }}>(coming soon...)</p>
          </Card>
        </section>
      </div>
    </PageContent>
  );
};

export default AboutPage;
