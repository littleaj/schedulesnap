# ScheduleSnap — Design Spec v1

Reference spec for implementation. Client-only app, no custom backend.

## Summary
A React PWA. Photo of a work schedule → Gemini vision extraction (via Firebase AI Logic) → user confirms on a mini week-view → events written directly to Google Calendar via the browser.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React (Vite + TypeScript, strict mode) |
| Routing | React Router |
| Styling | Plain CSS, Material Design color roles as CSS custom properties (`colors.css`) |
| State management | React Context + hooks (no external library) |
| Local draft persistence | `localStorage` — caches in-progress confirm-screen state so an aborted session isn't lost |
| Auth | Firebase Auth, Google provider, incremental `calendar.events` scope — **required**, app blocks usage if declined |
| Vision extraction | Firebase AI Logic → `gemini-2.5-flash` |
| App integrity | Firebase App Check, reCAPTCHA v3 |
| Persistence (server) | Firestore — per-user profile doc only |
| Hosting | Firebase Hosting, single Firebase project shared across dev/preview/production |
| Unit/integration tests | Jest + React Testing Library (+ `axe-core` for automated a11y checks) |
| E2E tests | Playwright |
| CI/CD | GitHub Actions — PR preview channels (Firebase Hosting preview) + production deploy on merge to `main` |
| PWA | Installable only — manifest + icons, no service worker/offline caching |
| Ads | Google AdSense — single bottom-anchored banner, shown only on Settings and Confirm screens |
| Consent (GDPR/EEA/UK) | AdSense's built-in "Privacy & messaging" CMP (TCF v2.3), configured in the AdSense dashboard — no custom consent code |

## Folder structure (type-based)

```
src/
  components/     # presentational + container components
  components/atoms
  components/molecules
  components/organisms
  components/templates
  components/pages
  hooks/          # useAuth, useShiftExtraction, useCalendar, useDraftCache, etc.
  services/       # Firebase, Gemini, Google Calendar API wrappers
  context/        # React Context providers (auth, user profile)
  types/          # shared TypeScript interfaces
  utils/          # image resize, date/time helpers, validation, overlap detection
  styles/         # colors.css (Material Design tokens) + any shared global CSS
tests/
  unit/           # Jest + RTL
  e2e/            # Playwright
```

## Routes (React Router)
- `/login` — Google sign-in, requests `calendar.events` scope. Declining blocks all other routes (redirect back here).
- `/onboarding` — first-run profile setup (name; timezone auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`, editable; reminder preference; default calendar; default shift name; optional name prefix).
- `/capture` — native file input (`capture="environment"`), no custom camera stream.
- `/preview` — shows the captured photo with retake/confirm-send options before it goes to Gemini.
- `/analyze` — dedicated AI-processing route where the image is resized, sent to Firebase AI Logic / Gemini, the structured response is parsed, and the extracted shifts are cached for review. This is the only route that performs direct AI Logic interaction.
- `/confirm` — mini week-view (hand-rolled grid) of extracted shifts; validation, overlap/conflict resolution, and manual-entry fallback all happen here. Includes ad banner and the accuracy disclaimer.
- `/settings` — edit profile (name, timezone, reminder, default calendar) anytime, not just onboarding. Includes ad banner.
- `/privacy` — privacy policy, required by Google's EU User Consent Policy and linked from the AdSense CMP config.
- `/terms` — terms of service. Not required by AdSense, but reasonable given the app writes to a user's Google Calendar and stores a profile — mostly protects the developer (no guarantee of extraction accuracy, limitation of liability).

## Color system (Material Design)
- `src/styles/colors.css` defines Material Design 3-style color roles as CSS custom properties: `--md-primary`, `--md-on-primary`, `--md-primary-container`, `--md-on-primary-container`, `--md-secondary`, `--md-surface`, `--md-on-surface`, `--md-background`, `--md-error`, `--md-on-error`, `--md-outline`, etc.
- **Import strategy:** imported once, globally, in `src/main.tsx` before the app renders (`import './styles/colors.css'`). This makes every token available to every component's own CSS file via `var(--md-primary)` — no per-component re-import needed.
- Component CSS files reference these variables rather than hardcoding hex values, so the palette has one source of truth and can be re-themed by editing a single file.
- Token values must meet WCAG AA contrast (4.5:1 for body text) — check this when picking the actual hex values, not just when picking role names.

## User flow
1. Sign in with Google (Firebase Auth), requesting the `calendar.events` scope. If declined, app blocks all functionality until granted.
2. First-time users complete onboarding (name, timezone, reminder preference, default calendar). Editable later anytime via Settings.
3. Take a photo via native file input.
4. Preview screen: retake or proceed.
5. On proceed, navigate to `/analyze`. This route is dedicated to the AI phase: the client resizes the image via Canvas API (max dimension ~1024px, JPEG quality 0.8, no external library), sends it to Gemini via Firebase AI Logic, and uses the user's stored name in the prompt.
6. Response parsed into `ExtractedShift[]`, immediately cached to `localStorage`.
   - If extraction fails entirely (bad photo, API error, zero shifts found): show a clear error message (see Error messages below) with a next step — retake or manual entry (one shift at a time).
7. Once extraction succeeds, navigate to `/confirm`. The confirm screen then queries Google Calendar for existing events in the shift date range and runs overlap detection (including **partial** overlaps — see Conflict detection below) against every extracted shift.
8. Confirm screen (mini week-view) — validation, conflict resolution, and confirmation all happen together, in one pass:
   - A persistent disclaimer banner: extracted data can contain mistakes, review before adding to your calendar.
   - Every edit (inline fix, skip/write choice, calendar change) re-saves the draft to `localStorage`.
   - Every shift has an editable name field, pre-populated per the Shift naming rules above (extracted name, or default + prefix); this is what becomes the calendar event title.
   - Low-confidence shifts editable inline.
   - Client-side validation blocks a shift from submission if its end time is before its start time (or other basic invalid data) — shown as an inline error on that shift only; other valid shifts remain submittable. "Add to Calendar" is disabled only if zero shifts are currently valid and approved.
   - Conflicting shifts show every overlapping existing event inline (time range + title) on the shift block, not just a generic "conflict" flag. User chooses **write anyway** or **skip** per shift, right there — no separate conflict-resolution step.
   - Calendar picker: dropdown select, defaults to the user's `defaultCalendarId`.
9. On confirm, client calls `events.insert` per approved shift (no recurrence rules), applying the reminder preference.
   - Partial batch failure: auto-retry failed inserts up to 3 times, then show an error with a manual "retry" button for the ones still failing.
   - On full success, the `localStorage` draft cache is cleared.
10. If the app is reopened to `/confirm` and a cached draft exists, prompt to resume or discard it.

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
  defaultCalendarId: string;     // defaults to "primary"
  defaultShiftName: string;      // used as the calendar event title when no name is extracted, e.g. "Work Shift"
  namePrefix?: string;           // optional, prepended to whatever name is used, e.g. "Retail - "
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
  name?: string;           // shift label if visibly present on the schedule, e.g. "Morning Shift", "Front Register"
  role?: string;
  location?: string;
  confidence: number;     // 0.0–1.0
  rawText: string;
}

interface CalendarConflict {
  eventId: string;
  summary: string;
  start: string;          // ISO datetime of the existing event
  end: string;
}

interface ConfirmedShift extends ExtractedShift {
  name: string;                     // resolved, always-populated, user-editable — this becomes the calendar event summary
  status: "pending" | "conflict-unresolved" | "approved" | "skipped";
  conflicts: CalendarConflict[];   // every overlapping existing event, not just one
  validationError?: string;         // e.g. "End time is before start time"
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

interface DraftCache {
  shifts: ConfirmedShift[];
  selectedCalendarId: string;
  savedAt: string;        // ISO timestamp, for staleness checks on resume
}
```

## Gemini extraction
- `responseSchema` enforces structured JSON output (shifts, warnings, scheduleOwnerGuess).
- System prompt parameterized with `{{TODAY_ISO}}` and `{{TARGET_NAME}}` (from `UserProfile.targetName`).
- Model: `gemini-2.5-flash`, image sent as `inlineData` base64, resized client-side first.
- Prompt instructs the model to extract a shift `name`/label only if one is visibly present on the schedule (e.g. "Morning", "PM Shift", "Front Register"); otherwise omit it rather than guessing. Name resolution to a real value happens client-side (see Shift naming below).

## Shift naming
Every `ConfirmedShift.name` is resolved when the confirm screen loads, then freely editable:

```typescript
resolvedName = (profile.namePrefix ?? '') + (extracted.name || profile.defaultShiftName)
```

- If Gemini found a name on the schedule, it's used; otherwise falls back to the user's `defaultShiftName` (set in Settings/onboarding, e.g. "Work Shift").
- `namePrefix` is optional and applied to either case, letting the user brand every event consistently (e.g. "Retail - Morning Shift" or "Retail - Work Shift").
- This becomes the field pre-populated in the confirm screen's editable name input per shift — the user can override it entirely.
- This is also the value sent as `summary` on `events.insert` (see below).

## Google Calendar API calls (all direct `fetch` from browser, using the OAuth access token from Firebase Auth)
- `calendarList.list` — populate the calendar dropdown, default selection = `defaultCalendarId`.
- `events.list` (time-bounded to the shift date range) — used for conflict detection.
- `events.insert` — one call per approved shift, retried up to 3 times on failure. `ConfirmedShift.name` (resolved via extraction/default/prefix, and possibly user-edited) is sent as `summary`:

```json
{
  "summary": "Retail - Morning Shift",
  "reminders": {
    "useDefault": false,
    "overrides": [{ "method": "popup", "minutes": 60 }]
  }
}
```

(omit `overrides` / set `useDefault: true` if reminders are disabled in the profile)

## Conflict detection (including partial overlaps)
Two ranges overlap if `shift.start < existingEvent.end && existingEvent.start < shift.end` — this catches partial overlaps (e.g. a 9am–5pm shift against an existing 4pm–6pm event), not just exact-match duplicates. For each extracted shift, collect **all** overlapping existing events (there can be more than one) into `ConfirmedShift.conflicts`. The confirm screen shows each conflict's title and time range inline on the shift block; the user resolves it right there (write anyway / skip) as part of normal confirmation, not a separate step.

## Client-side validation (confirm + manual entry, shared logic)
- `endTime` must be after `startTime` for a given shift.
- `date` must be a valid ISO date.
- Required fields (`date`, `startTime`, `endTime`) must be present.
- Invalid shifts are flagged inline (`validationError`) and excluded from submission until fixed; they don't block submitting the rest of the batch.
- The manual-entry fallback form reuses this same validator.

## Local draft persistence
- Key: `schedulesnap:draft-confirmation`. Value: serialized `DraftCache`.
- Written on: successful extraction, and on every subsequent edit on the confirm screen (debounced).
- Read on: navigating to `/confirm` — if a cache exists, prompt "Resume previous review?" vs. discard and start fresh. Treat drafts older than ~24h as stale and default to discarding.
- Cleared on: full successful submission (all approved shifts written).
- Scope: per-device only, not synced to Firestore — this is intentionally ephemeral, separate from the permanent user profile.

## Auth token refresh & reauthentication
Firebase Auth refreshes the Firebase ID token automatically, but the **Google OAuth access token** used for Calendar API calls is a separate, short-lived credential that isn't auto-refreshed by Firebase.
- On a 401 from a Calendar API call, first attempt a **silent** reacquisition via the Google Identity Services token client (`google.accounts.oauth2.initTokenClient`, `requestAccessToken({ prompt: '' })`) — this can succeed without any UI if the user's Google session and prior consent are still valid.
- If silent refresh fails, show an inline message on the **current page** (no navigation, no losing the in-progress confirm-screen state — which is safe anyway thanks to the `localStorage` draft cache) with a **"Reauthenticate"** button. Clicking it triggers the OAuth popup (`requestAccessToken({ prompt: 'consent' })` or similar); once a fresh token comes back, the pending action (e.g. the calendar write) resumes automatically.

## Error messages
Every failure state pairs what went wrong with what to do next — no bare "Error" text.

| Scenario | Message | Action(s) |
| --- | --- | --- |
| Extraction found zero shifts / bad photo | "Couldn't read that schedule. The photo might be blurry, dark, or not show a schedule." | Retake Photo / Enter Manually |
| Extraction API/network error | "Something went wrong reading your photo. Check your connection and try again." | Try Again / Enter Manually |
| Calendar write failed after 3 retries | "Couldn't add N shift(s) to your calendar. Nothing was lost — you can retry now." | Retry |
| Camera permission denied | "Camera access is off. Enable it in your browser settings, or upload a photo instead." | Upload Photo Instead |
| Calendar OAuth scope declined | "ScheduleSnap needs permission to add events to your Google Calendar to work." | Grant Access |
| Auth token expired, silent refresh failed | "Your Google sign-in needs a refresh. Your reviewed shifts are saved." | Reauthenticate |

## Accuracy disclaimer
Persistent (not dismissible) banner on the confirm screen: schedules are extracted by AI and can contain mistakes — review each shift before adding it to your calendar. This sits above the week-view, not buried in a tooltip.

## Confirm screen (mini week-view)
- Hand-rolled 7-day grid — no calendar library.
- Conflicts shown inline per shift block (title + time of each overlapping event), resolved via write-anyway/skip at the same time as general confirmation.
- Validation errors shown inline per shift block.
- Tapping a shift opens inline edit (date/time/role).
- Manual-entry fallback: same shift-editing component, one shift entered/added at a time.
- Accuracy disclaimer banner, ad banner (bottom-anchored, below actions).

## Accessibility plan
- **Week-view grid:** roving-tabindex keyboard navigation (arrow keys between shift blocks, Enter/Space to open inline edit); each block gets a descriptive `aria-label` (e.g. "Tuesday Sep 8, 9am–5pm, Barista — conflicts with an existing event, needs review").
- **Async states:** an `aria-live="polite"` region announces transitions (extraction in progress → complete/failed, calendar write in progress → complete/failed) so screen-reader users aren't left on a silent screen during multi-second Gemini/Calendar calls.
- **Forms:** every input (manual entry, onboarding, settings) has a real `<label>` tied via `htmlFor`/`id`; validation errors linked via `aria-describedby`.
- **Focus management:** reauthenticate prompt and inline edit both receive focus when they appear; focus returns to the triggering element on dismiss.
- **Icon-only controls** (retake, retry, skip) always have an `aria-label` or visible text, never icon-only with no accessible name.
- **Color contrast:** enforced at the token level in `colors.css` (WCAG AA, 4.5:1 for body text) rather than checked ad hoc per component.
- **Testing:** `axe-core` run as part of the Jest/RTL suite on key screens (confirm, onboarding, settings), not just manual spot checks.

## Ads (Google AdSense)
- One responsive banner ad unit, bottom-anchored, never overlapping interactive controls.
- **Shown on:** Settings, Confirm (placed below the shift list and action buttons).
- **Not shown on:** Login, Onboarding, Capture, Preview — these need full user focus and shouldn't risk misclicks near a camera/action UI.
- **Consent:** enable AdSense's "Privacy & messaging" → European regulations message (built-in Google CMP, TCF v2.3) in the AdSense dashboard. Requires a linked privacy policy URL — see `/privacy` route.
- **Script loading:** standard AdSense async script tag, loaded once (e.g. in `index.html` or a top-level `<AdSenseScript>` component) — this is a third-party script and doesn't conflict with the "client-only" architecture, it's still no custom backend.
- **CSP note:** if a Content-Security-Policy is added later, allow AdSense's domains (`*.googlesyndication.com`, `*.googleadservices.com`, `*.google.com`, `*.doubleclick.net`).

## AdSense account setup checklist

### Dashboard (adsense.google.com)
- [ ] Sign up with the live ScheduleSnap domain, payment country, and a real mailing address (Google mails a physical PIN once earnings hit threshold).
- [ ] Add the site under "Sites" and verify ownership (ads.txt method — see below).
- [ ] Enable **Privacy & messaging → European regulations**, link the `/privacy` policy URL.
- [ ] Submit for review. No email when review starts — check the dashboard. Can take a few weeks.
- [ ] Once approved: enter payment info (bank details, tax forms) under Payments.
- [ ] Once earnings hit the PIN threshold: enter the mailed PIN to unlock payouts.

### Codebase
- [ ] Add `ads.txt` (content copied from AdSense → Account → Account settings) to `public/`, so it deploys to the domain root via Firebase Hosting.
- [ ] Add the AdSense async script tag to `index.html` `<head>`.
- [ ] Build the ad unit component, wired to Settings and Confirm screens per the placement decision above.
- [ ] Confirm the public landing page (already built) is fully crawlable/unauthenticated — this is what Google's review actually evaluates, since the rest of the app sits behind sign-in.
- [ ] Deploy, then verify `yourdomain.com/ads.txt` loads as plain text before requesting review.

## Testing
- **Unit/integration (Jest + RTL):** image resize utility, shift validation (start/end time), overlap-detection logic (including partial overlaps), Firestore profile read/write, retry logic, draft-cache save/load/expiry, silent-token-refresh fallback path, individual components (confirm screen, calendar dropdown, manual-entry form, Settings screen), `axe-core` checks on key screens.
- **E2E (Playwright):** full flow with mocked Gemini/Calendar responses — sign-in (including declined-scope block) → capture → preview/retake → confirm → calendar write; extraction-failure → manual-entry path; conflict banner → write-anyway/skip path; validation-error → blocked-submission path; partial-batch-failure → auto-retry → manual-retry path; abort mid-confirm → reload → resume-draft prompt; token-expiry → silent-refresh-fails → reauthenticate-button path.

## CI/CD (GitHub Actions)
- On PR: run unit + E2E tests, deploy to a Firebase Hosting preview channel.
- On merge to `main`: run full test suite, deploy to production Firebase Hosting.

## PWA
- `manifest.json` + icon set for installability (Add to Home Screen).
- No service worker / offline caching in v1 — the app requires network access for both Gemini and Calendar API calls anyway.

## Open items
- App icon assets and exact `manifest.json` theme/background colors.
- Loading-state visual design (spinner vs. skeleton) for the multi-second Gemini/Calendar calls.
- Terms of service exact legal copy (page/route now spec'd; content still to be drafted, likely with legal review).
