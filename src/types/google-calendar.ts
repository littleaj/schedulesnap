export interface GoogleCalendarDateTime {
  dateTime: string;
  timeZone: string;
}

export interface GoogleCalendarReminder {
  method: string;
  minutes: number;
}

export interface GoogleCalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  reminders?: {
    useDefault?: boolean;
    overrides?: GoogleCalendarReminder[];
  };
}
