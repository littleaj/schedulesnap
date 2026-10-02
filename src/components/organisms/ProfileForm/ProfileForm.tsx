import React, { useContext, useEffect, useState } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import LabeledInput from '@/components/atoms/LabeledInput';
import LabeledSelect from '@/components/atoms/LabeledSelect';
import type { UserProfile, UserProfileValidationErrors } from '@/types/user-profile';
import './ProfileForm.css';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import { useFirestore } from '@/hooks/firebase';
import useCurrentUser from '@/hooks/current-user';
import {
  buildDefaultUserProfile,
  getUserProfile,
  saveUserProfile,
} from '@/services/user-profile';
import { Card } from '@/components/atoms/Card';

interface ProfileFormProps {
  heading: string;
  subheading: string;
  submitLabel: string;
  onSubmit?: () => void;
}

const getTimeZoneOptions = () => {
  return Intl.supportedValuesOf('timeZone').map((tz) => ({ value: tz, label: tz }));
};

interface CalendarOption {
  value: string;
  label: string;
}

const getCalendarOptions = async (token: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar list: ${response.statusText}`);
    }

    // TODO: cache this response in local storage.
    // TODO: add a refresh button next to the calendar select input.
    const data = await response.json();

    return data.items.map((calendar: any) => ({ value: calendar.id, label: calendar.summary })) as CalendarOption[];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    return [{ value: 'primary', label: 'Primary' }];
  }
};

const ProfileForm = ({ heading, subheading, submitLabel, onSubmit }: ProfileFormProps) => {
  const firestore = useFirestore();
  const user = useCurrentUser();
  const [calendarOptions, setCalendarOptions] = useState<CalendarOption[]>([{ value: 'primary', label: 'Primary' }]);
  const timezoneOptions = getTimeZoneOptions();
  const { getToken } = useContext(GoogleOAuthTokenContext);
  const [initializing, setInitializing] = useState(true);

  const [values, setValues] = useState<UserProfile>(() =>
    buildDefaultUserProfile(Intl.DateTimeFormat().resolvedOptions().timeZone, user?.displayName ?? null),
  );
  const [errors, setErrors] = useState<UserProfileValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateProfile = (profile: UserProfile): UserProfileValidationErrors => {
    const errs: UserProfileValidationErrors = {};

    if (!profile.targetName.trim()) {
      errs.targetName = 'Name is required.';
    }

    if (!profile.timezone.trim()) {
      errs.timezone = 'Timezone is required.';
    }

    if (!profile.defaultCalendarId.trim()) {
      errs.defaultCalendarId = 'Default calendar is required.';
    }

    if (profile.reminder.enabled && profile.reminder.minutesBefore <= 0) {
      errs.reminderMinutesBefore = 'Reminder minutes must be greater than zero.';
    }

    return errs;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setInitializing(false);
      return;
    }

    const doFetch = async () => {
      try {
        const options = await getCalendarOptions(token);
        setCalendarOptions(options);
      } catch (error) {
        console.error('Error fetching calendar list:', error);
      } finally {
        setInitializing(false);
      }
    };

    void doFetch();
  }, [getToken]);

  useEffect(() => {
    const loadProfile = async () => {
      const uid = user?.uid;
      if (!uid) {
        setIsLoading(false);
        setErrorMessage('Unable to load profile because no user is signed in.');
        return;
      }

      try {
        const existingProfile = await getUserProfile(firestore, uid);
        const defaultProfile = buildDefaultUserProfile(
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          user?.displayName ?? null,
          user?.email ?? 'primary',
        );
        setValues(existingProfile ?? defaultProfile);
      } catch (error) {
        console.error('Unable to load user profile: ', error);
        setErrorMessage('Unable to load your profile right now. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user, firestore]);

  const setTargetName = (value: string) => {
    setSuccessMessage(null);
    setValues((current) => ({ ...current, targetName: value }));
  };

  const setTimezone = (value: string) => {
    setSuccessMessage(null);
    setValues((current) => ({ ...current, timezone: value }));
  };

  const setDefaultCalendarId = (value: string) => {
    setSuccessMessage(null);
    setValues((current) => ({ ...current, defaultCalendarId: value }));
  };

  const setReminderEnabled = (value: boolean) => {
    setSuccessMessage(null);
    setValues((current) => ({
      ...current,
      reminder: {
        ...current.reminder,
        enabled: value,
      },
    }));
  };

  const setReminderMinutesBefore = (value: number) => {
    setSuccessMessage(null);
    setValues((current) => ({
      ...current,
      reminder: {
        ...current.reminder,
        minutesBefore: Number.isFinite(value) ? value : 0,
      },
    }));
  };

  const submit = async () => {
    const validationErrors = validateProfile(values);
    setErrors(validationErrors);
    setErrorMessage(null);

    if (Object.keys(validationErrors).length > 0) {
      return false;
    }

    const uid = user?.uid;
    if (!uid) {
      setErrorMessage('Unable to save profile because no user is signed in.');
      return false;
    }

    setIsSubmitting(true);
    try {
      await saveUserProfile(firestore, uid, values);
      setSuccessMessage('Profile saved');
      onSubmit?.();
      return true;
    } catch (error) {
      console.error('Unable to save profile: ', error);
      setErrorMessage('Unable to save your profile right now. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  let submitButtonLabel = submitLabel;
  if (isLoading) {
    submitButtonLabel = 'Loading profile...';
  } else if (isSubmitting) {
    submitButtonLabel = 'Saving...';
  }

  if (initializing) {
    return <p>Initializing...</p>;
  }

  return (
    <Card element={<section />} className="profile-form" aria-labelledby="profile-form-heading">
      <header className="profile-form__header">
        <h1 id="profile-form-heading">{heading}</h1>
        <p>{subheading}</p>
      </header>

      <div className="profile-form__fields">
        <LabeledInput
          id="target-name"
          label="Name on schedule"
          value={values.targetName}
          onChange={(event) => setTargetName(event.target.value)}
          hint="Used to find your shifts on the schedule"
          error={errors.targetName}
        />

        <LabeledSelect
          id="timezone"
          label="Timezone"
          value={values.timezone}
          options={timezoneOptions}
          onChange={(event) => setTimezone(event.target.value)}
          error={errors.timezone}
        />

        <LabeledSelect
          id="default-calendar"
          label="Default calendar"
          value={values.defaultCalendarId}
          options={calendarOptions}
          onChange={(event) => setDefaultCalendarId(event.target.value)}
          error={errors.defaultCalendarId}
        />
      </div>

      {errorMessage ? <p className="profile-form__error" role="alert">{errorMessage}</p> : null}
      {successMessage ? <p className="profile-form__success">{successMessage}</p> : null}

      <ActionButton
        variant="primary"
        className="profile-form__submit"
        onClick={() => void submit()}
        disabled={isLoading || isSubmitting}
      >
        {submitButtonLabel}
      </ActionButton>
    </Card>
  );
};

export default ProfileForm;
