import React, { useContext, useEffect, useState } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import LabeledInput from '@/components/atoms/LabeledInput';
import LabeledSelect from '@/components/atoms/LabeledSelect';
import ReminderSettings from '@/components/molecules/ReminderSettings';
import type { UserProfile, UserProfileValidationErrors } from '@/types/user-profile';
import './ProfileForm.css';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';

interface ProfileFormProps {
  heading: string;
  subheading: string;
  values: UserProfile;
  errors: UserProfileValidationErrors;
  isLoading: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  errorMessage?: string | null;
  successMessage?: string | null;
  onTargetNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onDefaultCalendarIdChange: (value: string) => void;
  onReminderEnabledChange: (value: boolean) => void;
  onReminderMinutesChange: (value: number) => void;
  onSubmit: () => void;
}

const getTimeZoneOptions = () => {
  return Intl.supportedValuesOf('timeZone').map((tz) => ({ value: tz, label: tz }));
};

const getCalendarOptions = async (token: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // TODO: cache this response in local storage.
    // TODO: add a refresh button next to the calendar select input.
    const data = await response.json();

    return data.items.map((calendar: any) => ({ value: calendar.id, label: calendar.summary }));
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    return [{ value: 'primary', label: 'Primary' }];
  }
};

const ProfileForm = ({
  heading,
  subheading,
  values,
  errors,
  isLoading,
  isSubmitting,
  submitLabel,
  errorMessage,
  successMessage,
  onTargetNameChange,
  onTimezoneChange,
  onDefaultCalendarIdChange,
  onReminderEnabledChange,
  onReminderMinutesChange,
  onSubmit,
}: ProfileFormProps) => {
  const [calendarOptions, setCalendarOptions] = useState([{ value: 'primary', label: 'Primary' }]);
  const timezoneOptions = getTimeZoneOptions();
  const { getToken } = useContext(GoogleOAuthTokenContext);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }
    getCalendarOptions(token).then(options => setCalendarOptions(options));
  }, [getToken]);

  let submitButtonLabel = submitLabel;
  if (isLoading) {
    submitButtonLabel = 'Loading profile...';
  } else if (isSubmitting) {
    submitButtonLabel = 'Saving...';
  }

  return (
    <section className="profile-form" aria-labelledby="profile-form-heading">
      <header className="profile-form__header">
        <h1 id="profile-form-heading">{heading}</h1>
        <p>{subheading}</p>
      </header>

      <div className="profile-form__fields">
        <LabeledInput
          id="target-name"
          label="Name on schedule"
          value={values.targetName}
          onChange={(event) => onTargetNameChange(event.target.value)}
          hint="Used to focus extraction on the right person."
          error={errors.targetName}
        />

        <LabeledSelect
          id="timezone"
          label="Timezone"
          value={values.timezone}
          options={timezoneOptions}
          onChange={(event) => onTimezoneChange(event.target.value)}
          error={errors.timezone}
        />

        <LabeledSelect
          id="default-calendar"
          label="Default calendar"
          value={values.defaultCalendarId}
          options={calendarOptions}
          onChange={(event) => onDefaultCalendarIdChange(event.target.value)}
          error={errors.defaultCalendarId}
        />

        <ReminderSettings
          enabled={values.reminder.enabled}
          minutesBefore={values.reminder.minutesBefore}
          error={errors.reminderMinutesBefore}
          onEnabledChange={onReminderEnabledChange}
          onMinutesBeforeChange={onReminderMinutesChange}
        />
      </div>

      {errorMessage ? <p className="profile-form__error" role="alert">{errorMessage}</p> : null}
      {successMessage ? <p className="profile-form__success">{successMessage}</p> : null}

      <ActionButton
        variant="primary"
        className="profile-form__submit"
        onClick={onSubmit}
        disabled={isLoading || isSubmitting}
      >
        {submitButtonLabel}
      </ActionButton>
    </section>
  );
};

export default ProfileForm;
