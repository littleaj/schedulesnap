import type { GoogleCalendarEvent } from '@/types/google-calendar';

const GOOGLE_CALENDAR_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

async function createEvent(accessToken: string, calendarId: string, eventBody: GoogleCalendarEvent): Promise<Response> {
  return fetch(
    `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    },
  );
}

async function getCalendarList(accessToken: string): Promise<Response> {
  return fetch(
    `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
}

export default {
  withAccessToken: (accessToken: string) => ({
    createEvent: (calendarId: string, eventBody: GoogleCalendarEvent) => createEvent(accessToken, calendarId, eventBody),
    getCalendarList: () => getCalendarList(accessToken),
  }),
};

