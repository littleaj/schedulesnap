import React from 'react';
import { Link } from 'react-router';
import PageContent from '@/components/templates/PageContent';
import './PrivacyPage.css';

const PrivacyPage = () => {
  return (
    <PageContent className="privacy-page">
      <section className="privacy-page__header">
        <hgroup className="centered">
          <p className="eyebrow">Privacy</p>
          <h1>Privacy Policy</h1>
        </hgroup>
        <p className="centered">
          <strong>Effective date:</strong> <em>September 26, 2026</em>
        </p>
        <p className="intro">
          This Privacy Policy explains how ScheduleSnap ("the app," "we," "us")
          collects, uses, and shares information when you use the app. ScheduleSnap
          is an independently developed application; it is not operated by a
          registered company.
        </p>
        <p>If you have questions about this policy or your data, contact us at:</p>
        <p className="centered">
          <strong>schedulesnap@googlegroups.com</strong>
        </p>
      </section>

      <hr />

      <section aria-label="Information we collect">
        <h2>Information We Collect</h2>

        <h3>Account information</h3>
        <p>
          When you sign in with your Google account, we receive your Google
          account ID, name, and email address via Firebase Authentication. This
          is used solely to identify your account within the app.
        </p>

        <h3>Profile information</h3>
        <p>You provide the following, which is stored in our database (Firestore), tied to your account:</p>
        <ul>
          <li>Timezone</li>
          <li>Reminder preferences</li>
          <li>Default calendar selection</li>
          <li>Default shift name and optional name prefix</li>
        </ul>

        <h3>Schedule photos</h3>
        <p>
          When you photograph a work schedule, the image is sent directly from
          your device to Google's Gemini AI model (via Firebase AI Logic) to
          extract shift details. The image itself is not stored on our servers
          before or after this process — it exists only transiently to perform
          the extraction and is not retained by us.
        </p>

        <h3>Google Calendar access</h3>
        <p>
          With your permission (granted via Google OAuth), the app reads your
          calendar list and creates calendar events on your behalf. We do not
          read the content of your existing calendar events beyond what's needed
          to check for scheduling conflicts, and we do not store your calendar
          data outside your own Google Calendar.
        </p>

        <h3>Locally stored data</h3>
        <p>
          The app temporarily caches in-progress shift review data in your
          browser's local storage, so an interrupted session isn't lost. This
          data stays on your device and is cleared automatically once you finish
          adding shifts to your calendar.
        </p>

        <h3>Analytics</h3>
        <p>
          We use Google Analytics to understand how the app is used (e.g., which
          features are used, general usage patterns). Google Analytics may use
          cookies and collect information such as your device type, browser,
          and general usage behavior. This data is aggregated and not used to
          identify you personally by us.
        </p>

        <h3>Advertising</h3>
        <p>
          The app displays ads served through Google AdSense. AdSense may use
          cookies and similar technologies to serve ads, which may include
          personalized advertising depending on your consent choices. If you are
          in the UK/EEA, you will be shown a consent prompt (via Google's
          consent management platform) before any non-essential cookies are set,
          where you can manage your preferences.
        </p>
      </section>

      <hr />

      <section aria-label="How we use information">
        <h2>How We Use Information</h2>
        <p>We use the information described above only to:</p>
        <ul>
          <li>Authenticate you and maintain your session</li>
          <li>Extract shift data from photos you provide</li>
          <li>Create calendar events you've approved</li>
          <li>Apply your saved preferences (timezone, reminders, default calendar, naming)</li>
          <li>Understand aggregate app usage (via Google Analytics)</li>
          <li>Serve ads (via Google AdSense)</li>
        </ul>
        <p>
          We do not sell your personal information, and we do not use your
          schedule photos or calendar data for any purpose beyond providing the
          app's core functionality.
        </p>
      </section>

      <hr />

      <section aria-label="Third-party services">
        <h2>Third-Party Services</h2>
        <p>
          ScheduleSnap is built on the following third-party services, each of
          which processes data according to its own privacy policy:
        </p>

        <table className="third-party-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Purpose</th>
              <th>Privacy Policy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Firebase Authentication</td>
              <td>Sign-in</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
              </td>
            </tr>
            <tr>
              <td>Firebase Firestore</td>
              <td>Profile data storage</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
              </td>
            </tr>
            <tr>
              <td>Firebase AI Logic / Gemini</td>
              <td>Schedule photo extraction</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
              </td>
            </tr>
            <tr>
              <td>Firebase App Check / reCAPTCHA</td>
              <td>Bot/abuse protection</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
              </td>
            </tr>
            <tr>
              <td>Google Calendar API</td>
              <td>Reading/writing calendar events</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
              </td>
            </tr>
            <tr>
              <td>Google Analytics</td>
              <td>Usage analytics</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
              </td>
            </tr>
            <tr>
              <td>Google AdSense</td>
              <td>Advertising</td>
              <td>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Google Privacy Policy
                </a>
                {" "}
                &middot;
                {" "}
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">
                  How Google uses data
                </a>
              </td>
            </tr>
          </tbody>
        </table>

        <p>
          ScheduleSnap has no custom backend server — all of the above are
          Google-operated services accessed directly from your browser.
        </p>
      </section>

      <hr />

      <section aria-label="Data retention">
        <h2>Data Retention</h2>
        <ul>
          <li>
            <strong>Profile data</strong> is retained until you delete your
            account or request deletion (see below).
          </li>
          <li>
            <strong>Schedule photos</strong> are not retained by us; they pass
            through to Gemini for processing and are not stored.
          </li>
          <li>
            <strong>Local draft data</strong> is cleared automatically on
            successful calendar submission, or treated as stale and discarded
            after roughly 24 hours.
          </li>
          <li>
            <strong>Calendar events</strong> you create live in your own Google
            Calendar and are governed by your Google account settings, not by
            us.
          </li>
        </ul>
      </section>

      <hr />

      <section aria-label="Your rights and choices">
        <h2>Your Rights and Choices</h2>
        <ul>
          <li>
            <strong>Revoke Calendar access:</strong> You can revoke ScheduleSnap's
            access to your Google Calendar at any time via your{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions page</a>.
          </li>
          <li>
            <strong>Delete your data:</strong> Contact us at the email above to
            request deletion of your stored profile data.
          </li>
          <li>
            <strong>Cookie/ad consent:</strong> If you're in the UK/EEA, you can
            manage advertising consent through the consent prompt shown in the
            app.
          </li>
          <li>
            <strong>Access/correction:</strong> You can view and edit your stored
            profile information at any time in the app's Settings screen.
          </li>
        </ul>
      </section>

      <hr />

      <section aria-label="Childrens privacy">
        <h2>Children's Privacy</h2>
        <p>
          ScheduleSnap is not directed at children under 13, and we do not
          knowingly collect information from children under 13.
        </p>
      </section>

      <hr />

      <section aria-label="Changes to this policy">
        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on
          this page with an updated effective date.
        </p>
      </section>

      <hr />

      <section aria-label="Contact">
        <h2>Contact</h2>
        <p>
          Questions or requests regarding this policy or your data can be sent
          to:
        </p>
        <p className="centered">
          <strong>schedulesnap@googlegroups.com</strong>
        </p>
      </section>

      <aside className="privacy-page__aside centered">
        <Link to="/help">Need help?</Link>
      </aside>
    </PageContent>
  );
};

export default PrivacyPage;
