import React from 'react';
import LabeledInput from '@/components/atoms/LabeledInput';
import './ReminderSettings.css';

interface ReminderSettingsProps {
  enabled: boolean;
  minutesBefore: number;
  error?: string;
  onEnabledChange: (enabled: boolean) => void;
  onMinutesBeforeChange: (minutesBefore: number) => void;
}

const ReminderSettings = ({
  enabled,
  minutesBefore,
  error,
  onEnabledChange,
  onMinutesBeforeChange,
}: ReminderSettingsProps) => {
  return (
    <fieldset className="reminder-settings">
      <legend>Reminder preferences</legend>

      <label className="reminder-settings__toggle" htmlFor="reminder-enabled">
        <input
          id="reminder-enabled"
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        <span>Enable reminders</span>
      </label>

      {enabled ? (
        <LabeledInput
          id="reminder-minutes-before"
          type="number"
          min={1}
          step={1}
          label="Minutes before"
          hint="Reminder popup lead time."
          error={error}
          value={String(minutesBefore)}
          onChange={(event) => onMinutesBeforeChange(Number(event.target.value))}
        />
      ) : null}
    </fieldset>
  );
};

export default ReminderSettings;
