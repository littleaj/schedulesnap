import { useState } from 'react';

export interface ShiftEditDraft {
  eventName: string;
  startTime: string;
  endTime: string;
}

interface ShiftEditDialogContentProps {
  initialDraft: ShiftEditDraft;
  onDraftChange: (draft: ShiftEditDraft) => void;
  shiftId: string;
}

const ShiftEditDialogContent = ({ initialDraft, onDraftChange, shiftId }: ShiftEditDialogContentProps) => {
  const [draft, setDraft] = useState<ShiftEditDraft>(initialDraft);

  const updateDraft = <TField extends keyof ShiftEditDraft>(field: TField, value: ShiftEditDraft[TField]) => {
    setDraft((currentDraft) => {
      const nextDraft = { ...currentDraft, [field]: value };
      onDraftChange(nextDraft);
      return nextDraft;
    });
  };

  return (
    <div className="confirm-card__edit-dialog">
      <label htmlFor={`edit-event-name-${shiftId}`}>Event Name</label>
      <input
        id={`edit-event-name-${shiftId}`}
        name="event-name"
        type="text"
        value={draft.eventName}
        onChange={(event) => updateDraft('eventName', event.target.value)}
      />
      <label htmlFor={`edit-start-time-${shiftId}`}>Start Time</label>
      <input
        id={`edit-start-time-${shiftId}`}
        name="start-time"
        type="text"
        value={draft.startTime}
        onChange={(event) => updateDraft('startTime', event.target.value)}
      />
      <label htmlFor={`edit-end-time-${shiftId}`}>End Time</label>
      <input
        id={`edit-end-time-${shiftId}`}
        name="end-time"
        type="text"
        value={draft.endTime}
        onChange={(event) => updateDraft('endTime', event.target.value)}
      />
    </div>
  );
};

export default ShiftEditDialogContent;
