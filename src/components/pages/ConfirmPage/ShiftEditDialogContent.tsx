import LabeledInput from '@/components/atoms/LabeledInput';
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
  nameInputRef?: React.Ref<HTMLInputElement>;
}

const ShiftEditDialogContent = ({ initialDraft, onDraftChange, shiftId, nameInputRef }: ShiftEditDialogContentProps) => {
  const [draft, setDraft] = useState<ShiftEditDraft>(initialDraft);

  const updateDraft = <TField extends keyof ShiftEditDraft>(
    field: TField,
    value: ShiftEditDraft[TField]
  ) => {
    const nextDraft = { ...draft, [field]: value };
    setDraft(nextDraft);
    onDraftChange(nextDraft);
  };

  return (
    <div className="confirm-card__edit-dialog">
      <LabeledInput
        id={`edit-event-name-${shiftId}`}
        label="Event Name"
        onChange={(event) => updateDraft('eventName', event.target.value)}
        value={draft.eventName}
        aria-label="Event Name"
        inputRef={nameInputRef}
      />
      <LabeledInput
        id={`edit-start-time-${shiftId}`}
        type="time"
        value={draft.startTime}
        onChange={(event) => updateDraft('startTime', event.target.value)}
        label="Start time"
        aria-label="Start Time"
      />
      <LabeledInput
        id={`edit-end-time-${shiftId}`}
        type="time"
        value={draft.endTime}
        onChange={(event) => updateDraft('endTime', event.target.value)}
        label="End time"
        aria-label="End Time"
      />
    </div>
  );
};

export default ShiftEditDialogContent;
