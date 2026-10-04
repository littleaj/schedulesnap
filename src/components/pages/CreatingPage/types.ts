import type { GoogleCalendarEvent } from "@/types/google-calendar";

export type EventStatus = 'pending' | 'success' | 'failed';

export interface QueuedEventItem {
  id: string;
  event: GoogleCalendarEvent;
  status: EventStatus;
}
