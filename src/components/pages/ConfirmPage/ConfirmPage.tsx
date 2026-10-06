import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import {
  clearAnalysisFlowCache,
  loadAnalysisResponse,
  loadDraftConfirmation,
  saveDraftConfirmation
} from '@/services/schedule-analysis';
import './ConfirmPage.css';
import type { WeekDay } from '@/types/shift-display';
import { convertTo24Hour } from '@/utils/time-utils';
import { buildWeekDays } from './utils/weekdays';
import useCurrentUser from '@/hooks/current-user';
import { useUserProfile } from '@/hooks/user-profile';
import { Card } from '@/components/atoms/Card';
import CalendarWeekList from './CalendarWeekList';
import type { ScheduleAnalysisShift } from '@/types/schedule-analysis';
import PageContent from '@/components/templates/PageContent';
import NoteBlock from '@/components/atoms/NoteBlock';

const ConfirmPage = () => {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const profile = useUserProfile();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const { uid } = user;

  const draftConfirmation = loadDraftConfirmation(uid);
  if (!draftConfirmation) {
    console.log('No draft confirmation found');
  }

  const analysisResponse = loadAnalysisResponse(uid);
  if (!draftConfirmation && !analysisResponse) {
    console.log('No analysis response found');
  }

  const shifts = useMemo(() => (draftConfirmation?.shifts ?? analysisResponse?.shifts ?? [])
    .filter(shift => shift.startTime || shift.endTime || shift.role || shift.location), [draftConfirmation, analysisResponse]);

  const weekDays = useMemo(() => (shifts.length > 0 ? buildWeekDays(shifts, profile ?? undefined) : []), [profile, shifts]);

  if (shifts.length > 0) {
    console.log("Loaded shifts from", draftConfirmation ? "draft confirmation" : "analysis response");
  }

  const hasEditableShift = useMemo(() => {
    return weekDays.some((day) => day.shifts.some((shift) => shift.startTime || shift.endTime || shift.eventName || shift.location));
  }, [weekDays]);

  const handleCreateEvents = () => {
    void navigate('/creating', {
      replace: true,
      viewTransition: true,
      state: {
        create: true,
        createRunId: crypto?.randomUUID?.() ?? `${Date.now()}`,
      },
    });
  };

  const saveShifts = useCallback((shifts: ScheduleAnalysisShift[]) => {
    saveDraftConfirmation(uid, {
      shifts: shifts.map(val => ({
        ...val,
        startTime: convertTo24Hour(val.startTime),
        endTime: convertTo24Hour(val.endTime)
      })),
      selectedCalendarId: profile?.defaultCalendarId ?? 'primary'
    });
  }, [uid, profile?.defaultCalendarId]);

  const saveWeekDays = useCallback((weekDays: WeekDay[]) => {
    saveShifts(weekDays.flatMap(
      (day) => day.shifts.map(
        (val) => ({
          ...val,
          role: val.eventName,
          startTime: convertTo24Hour(val.startTime),
          endTime: convertTo24Hour(val.endTime),
          // TODO: use this when we convert to EditableShift
          // isPlaceholder: !val.startTime && !val.endTime && !val.eventName && !val.location,
        } satisfies ScheduleAnalysisShift)
      )
    ));
  }, [saveShifts]);

  useEffect(() => {
    if (draftConfirmation || !analysisResponse) {
      return;
    }

    saveDraftConfirmation(uid, {
      shifts: shifts.map(val => ({ ...val, startTime: convertTo24Hour(val.startTime), endTime: convertTo24Hour(val.endTime) })),
      selectedCalendarId: profile?.defaultCalendarId ?? 'primary'
    });
  }, [profile?.defaultCalendarId, shifts, uid]);

  return (
    <PageContent className="confirm-page">
      <Card element={<section/>} className="confirm-card" aria-labelledby="confirm-title">
        <div className="confirm-card__header">
          <div className="confirm-card__heading-group">
            <p className="eyebrow">Review schedule</p>
            <h1 id="confirm-title">Review your shifts</h1>
            <p className="confirm-card__intro">
              Compare your shifts with the scanned image and make any necessary adjustments.
            </p>
          </div>
        </div>

        {shifts.length > 0 ? (
          <>
            <NoteBlock variant="information" className="confirm-card__disclaimer">
              <p role="note" aria-live="polite">
                Schedules are extracted by AI and can contain mistakes — review each shift before adding it to your calendar.
              </p>
            </NoteBlock>
            <Card className="confirm-card__summary" aria-label="Extracted shifts week view">
              <p className="confirm-card__summary-result">{shifts.length} shift{shifts.length === 1 ? '' : 's'} are ready to review.</p>
              <p className="confirm-card__summary-instruction">Please review and edit your shifts as needed.</p>
              <CalendarWeekList
                shifts={weekDays}
                onChange={saveWeekDays}
              />
            </Card>
          </>
        ) : (
          <p className="confirm-card__intro">
            No saved review was found. Start over from <Link to="/capture" replace>capture</Link> to continue.
          </p>
        )}

        <div className="confirm-card__actions">
          <ActionButton variant="primary" onClick={handleCreateEvents} disabled={!hasEditableShift}>
            Create Events
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => {
            if (!user) {
              console.warn("No user found while attempting to clear analysis flow cache.");
            } else {
              clearAnalysisFlowCache(user.uid);
            }
            void navigate("/");
          }}>
            Cancel and Delete Progress
          </ActionButton>
        </div>

        {analysisResponse?.warnings && analysisResponse.warnings.length > 0 ? (
          <Card element={<details />} className="confirm-card__warnings">
            <summary>Analysis Messages</summary>
            <ul>
              {analysisResponse.warnings.map((warning, index) => (
                <Card key={index} element={<li />} className="confirm-card__warning">{warning}</Card> // NOSONAR we're not reording this array, so index is fine for a key.
              ))}
            </ul>
          </Card>
        ) : null}
      </Card>
    </PageContent>
  );
};

export default ConfirmPage;
