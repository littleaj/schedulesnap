import EditableText from '@/components/atoms/EditableText';
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
      <EditableText
        id={`edit-event-name-${shiftId}`}
        value={draft.eventName}
        onCommit={(value) => updateDraft('eventName', value as string)}
        placeholder="Enter event name"
        ariaLabel="Event Name"
      />
      <label htmlFor={`edit-start-time-${shiftId}`}>Start Time</label>
      <EditableText
        id={`edit-start-time-${shiftId}`}
        type="time"
        value={draft.startTime}
        onCommit={(value) => updateDraft('startTime', value as string)}
        placeholder="Enter start time"
        ariaLabel="Start Time"
      />
      <label htmlFor={`edit-end-time-${shiftId}`}>End Time</label>
      <EditableText
        id={`edit-end-time-${shiftId}`}
        type="time"
        value={draft.endTime}
        onCommit={(value) => updateDraft('endTime', value as string)}
        placeholder="Enter end time"
        ariaLabel="End Time"
      />
    </div>
  );
};

export default ShiftEditDialogContent;
