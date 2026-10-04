import { loadDraftConfirmation } from "@/services/schedule-analysis";
import type { GoogleCalendarEvent } from "@/types/google-calendar";
import { useMemo } from "react";
import { buildWeekDays } from "../../ConfirmPage/utils/weekdays";
import { editableShift2GoogleCalendarEvent } from "@/utils/mappers";

const useDraftEvents = (uid: string) => {
  return useMemo(() => {
    const draft = loadDraftConfirmation(uid);
    const events: GoogleCalendarEvent[] = draft ? buildWeekDays(draft.shifts)
        .flatMap(day => day.shifts)
        .filter(s => !s.isPlaceholder && s.date && s.startTime && s.endTime) // validation
        .map((e) => editableShift2GoogleCalendarEvent(e))
        .filter(e => !!e)
      : [];

      return {
        events,
        calendarId: draft?.selectedCalendarId ?? "primary"
      }
  }, [uid]);
};

export default useDraftEvents;
