# ScheduleSnap — Design Spec v1

Reference spec for implementation. Client-only app, no custom backend.

## Summary
A React PWA. Photo of a work schedule → Gemini vision extraction (via Firebase AI Logic) → user confirms on a mini week-view → events written directly to Google Calendar via the browser.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React (Vite + TypeScript, strict mode) |
| Routing | React Router |
| Styling | Plain CSS |
| State management | React Context + hooks (no external library) |
| Auth | Firebase Auth, Google provider, incremental `calendar.events` scope — **required**, app blocks usage if declined |
| Vision extraction | Firebase AI Logic → `gemini-2.5-flash` |
| App integrity | Firebase App Check, reCAPTCHA v3 |
| Persistence | Firestore — per-user profile doc only, no scan history (v1) |
| Hosting | Firebase Hosting, single Firebase project shared across dev/preview/production |
| Unit/integration tests | Jest + React Testing Library |
| E2E tests | Playwright |
| CI/CD | GitHub Actions — PR preview channels (Firebase Hosting preview) + production deploy on merge to `main` |
| PWA | Installable only — manifest + icons, no service worker/offline caching |
| Ads | Google AdSense — single bottom-anchored banner, shown only on Settings and Confirm screens |
| Consent (GDPR/EEA/UK) | AdSense's built-in "Privacy & messaging" CMP (TCF v2.3), configured in the AdSense dashboard — no custom consent code |
| Monetization | Google AdSense |

## Folder structure (type-based)

```
src/
  components/     # presentational + container components
  hooks/          # custom hooks (useAuth, useShiftExtraction, useCalendar, etc.)
  services/       # Firebase, Gemini, Google Calendar API wrappers
  context/        # React Context providers (auth, user profile)
  types/          # shared TypeScript interfaces
  utils/          # image resize, date/time helpers
  routes/         # route-level page components (see Routes below)
tests/
  unit/           # Jest + RTL
  e2e/            # Playwright
```

## Routes (React Router)
- `/` — Home page. Includes logo and description of application.
- `/about` — About page describing the project in more detail.
- `/docs` — Documentation.
- `/login` — Google sign-in, requests `calendar.events` scope. Declining blocks all other routes (redirect back here).
- `/onboarding` — first-run profile setup (name; timezone auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`, editable; reminder preference; default calendar).
- `/capture` — native file input (`capture="environment"`), no custom camera stream.
- `/preview` — shows the captured photo with retake/confirm-send options before it goes to Gemini.
- `/confirm` — mini week-view (hand-rolled grid) of extracted shifts; manual-entry fallback form lives here too if extraction fails.
- `/settings` — edit profile (name, timezone, reminder, default calendar) anytime, not just onboarding. Includes ad banner.
- `/privacy` — privacy policy page, required by Google's EU User Consent Policy and linked from the AdSense CMP config. Includes an AdSense ad unit.

## User flow
1. Sign in with Google (Firebase Auth), requesting the `calendar.events` scope. If declined, app blocks all functionality until granted.
2. First-time users complete onboarding (name, timezone, reminder preference, default calendar). Editable later anytime via Settings.
3. Take a photo via native file input.
4. Preview screen: retake or proceed.
5. On proceed: client resizes the image via Canvas API (max dimension ~1024px, JPEG quality 0.8, no external library) and sends it to Gemini via Firebase AI Logic, prompt parameterized with the user's stored name.
6. Response parsed into `ExtractedShift[]`.
   - If extraction fails entirely (bad photo, API error, zero shifts found): show an error message AND offer the manual-entry fallback form (one shift at a time).
7. Client queries Google Calendar for existing events in the shift date range, flags overlaps as possible duplicates.
8. Confirm screen (mini week-view):
   - Low-confidence shifts editable inline.
   - Duplicate-flagged shifts show an inline banner/badge on the shift block (not a modal) — user chooses skip or create anyway per shift.
   - Calendar picker: dropdown select, defaults to the user's `defaultCalendarId`.
   - AdSense ad unit below the shift list (not interspersed between shifts, not on Capture/Preview screens).
9. On confirm, client calls `events.insert` per approved shift, applying the reminder preference.
   - Partial batch failure: auto-retry failed inserts up to 3 times, then show an error with a manual "retry" button for the ones still failing.

## Firebase services used
- **Firebase Auth** — Google sign-in + Calendar OAuth scope, no separate backend token exchange.
- **Firebase AI Logic** — Gemini multimodal calls straight from the browser, gated by App Check (reCAPTCHA v3).
- **Firestore** — lightweight per-user profile only.
- **Firebase Hosting** — serves the static Vite build; single project for dev/preview/production, PR preview channels via GitHub Actions.

No Cloud Functions, no custom server.

## Firestore schema
Single collection, one doc per user, keyed by Firebase Auth `uid`.

```typescript
// /users/{uid}
interface UserProfile {
  targetName: string;
  timezone: string;              // IANA tz, auto-detected on onboarding, editable in Settings
  reminder: {
    enabled: boolean;
    minutesBefore: number;
  };
  defaultCalendarId: string;     // defaults to primary calendar
}
```

Security rules: a user may only read/write the doc at `/users/{their own uid}`.

```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Client-side types

```typescript
interface ExtractedShift {
  date: string;          // ISO 8601, e.g. "2026-09-05"
  startTime: string;      // "HH:mm", 24hr
  endTime: string;
  role?: string;
  location?: string;
  confidence: number;     // 0.0–1.0
  rawText: string;
}

interface ConfirmedShift extends ExtractedShift {
  status: "pending" | "duplicate-flagged" | "approved" | "skipped";
  conflictingEventId?: string;
}

interface ExtractionResult {
  shifts: ExtractedShift[];
  warnings: string[];
  scheduleOwnerGuess?: string;
  failed: boolean;
}

interface CalendarWriteResult {
  shift: ConfirmedShift;
  status: "success" | "failed" | "retrying";
  attempt: number;        // up to 3
  error?: string;
}
```

## Gemini extraction
- `responseSchema` enforces structured JSON output (shifts, warnings, scheduleOwnerGuess).
- System prompt parameterized with `{{TODAY_ISO}}` and `{{TARGET_NAME}}` (from `UserProfile.targetName`).
- Model: `gemini-2.5-flash`, image sent as `inlineData` base64, resized client-side first.

## Google Calendar API calls (all direct `fetch` from browser, using the OAuth access token from Firebase Auth)
- `calendarList.list` — populate the calendar dropdown, default selection = `defaultCalendarId`.
- `events.list` (time-bounded to the shift date range) — duplicate detection before confirm.
- `events.insert` — one call per approved shift, retried up to 3 times on failure:

  ```json
  {
    "reminders": {
      "useDefault": false,
      "overrides": [{ "method": "popup", "minutes": 60 }]
    }
  }
  ```

  (omit `overrides` / set `useDefault: true` if reminders are disabled in the profile)

## Confirm screen (mini week-view)
- Hand-rolled 7-day grid — no calendar library.
- Duplicate conflicts: inline banner/badge on the affected shift block, not a modal.
- Tapping a shift opens inline edit (date/time/role).
- Manual-entry fallback: same shift-editing component, one shift entered/added at a time.

## Ads (Google AdSense)
- One responsive banner ad unit, bottom-anchored, never overlapping interactive controls.
- **Shown on:** Settings, Confirm (placed below the shift list and action buttons).
- **Not shown on:** Login, Onboarding, Capture, Preview — these need full user focus and shouldn't risk misclicks near a camera/action UI.
- **Consent:** enable AdSense's "Privacy & messaging" → European regulations message (built-in Google CMP, TCF v2.3) in the AdSense dashboard. Requires a linked privacy policy URL — see `/privacy` route.
- **Script loading:** standard AdSense async script tag, loaded once (e.g. in `index.html` or a top-level `<AdSenseScript>` component) — this is a third-party script and doesn't conflict with the "client-only" architecture, it's still no custom backend.
- **CSP note:** if a Content-Security-Policy is added later, allow AdSense's domains (`*.googlesyndication.com`, `*.googleadservices.com`, `*.google.com`, `*.doubleclick.net`).

## Testing
- **Unit/integration (Jest + RTL):** image resize utility, shift parsing/validation, duplicate-detection logic, Firestore profile read/write, retry logic, individual components (confirm screen, calendar dropdown, manual-entry form, Settings screen).
- **E2E (Playwright):** full flow with mocked Gemini/Calendar responses — sign-in (including declined-scope block) → capture → preview/retake → confirm → calendar write; extraction-failure → manual-entry path; duplicate-banner → skip/create-anyway path; partial-batch-failure → auto-retry → manual-retry path.

## CI/CD (GitHub Actions)
- On PR: run unit + E2E tests, deploy to a Firebase Hosting preview channel.
- On merge to `main`: run full test suite, deploy to production Firebase Hosting.

## PWA
- `manifest.json` + icon set for installability (Add to Home Screen).
- No service worker / offline caching in v1 — the app requires network access for both Gemini and Calendar API calls anyway.

## Monetization (Google AdSense)
- **Placement:** Settings screen, and a single banner unit below the shift list on the Confirm screen. Explicitly excluded from Capture and Preview — those are fast, task-focused screens and an ad there would hurt the core flow for minimal revenue.
- **Integration:** AdSense loads via a script tag in `index.html` plus per-page `<ins class="adsbygoogle">` ad units — pure client-side, no backend involvement, consistent with the rest of the architecture.
- **`ads.txt`:** must be served at the domain root (`/ads.txt`) — Firebase Hosting serves static files from root fine, just add it to the public/build directory.
- **Privacy policy:** required by AdSense's program policies. New `/privacy` route; should disclose the photo/schedule data flow (sent to Gemini), Calendar access, and ad personalization data usage.

