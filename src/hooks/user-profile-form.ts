import { useEffect, useMemo, useState } from 'react';
import { useAuth, useFirestore } from '@/hooks/firebase';
import {
  buildDefaultUserProfile,
  getUserProfile,
  saveUserProfile,
} from '@/services/user-profile';
import type { UserProfile, UserProfileValidationErrors } from '@/types/user-profile';

interface UseUserProfileFormOptions {
  successMessage: string;
}

interface UseUserProfileFormResult {
  values: UserProfile;
  errors: UserProfileValidationErrors;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  setTargetName: (value: string) => void;
  setTimezone: (value: string) => void;
  setDefaultCalendarId: (value: string) => void;
  setReminderEnabled: (value: boolean) => void;
  setReminderMinutesBefore: (value: number) => void;
  submit: () => Promise<boolean>;
}

const validateProfile = (profile: UserProfile): UserProfileValidationErrors => {
  const errors: UserProfileValidationErrors = {};

  if (!profile.targetName.trim()) {
    errors.targetName = 'Name is required.';
  }

  if (!profile.timezone.trim()) {
    errors.timezone = 'Timezone is required.';
  }

  if (!profile.defaultCalendarId.trim()) {
    errors.defaultCalendarId = 'Default calendar is required.';
  }

  if (profile.reminder.enabled && profile.reminder.minutesBefore <= 0) {
    errors.reminderMinutesBefore = 'Reminder minutes must be greater than zero.';
  }

  return errors;
};

const useUserProfileForm = ({ successMessage }: UseUserProfileFormOptions): UseUserProfileFormResult => {
  const auth = useAuth();
  const firestore = useFirestore();

  const [values, setValues] = useState<UserProfile>(buildDefaultUserProfile());
  const [errors, setErrors] = useState<UserProfileValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestSuccessMessage, setLatestSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setIsLoading(false);
        setErrorMessage('Unable to load profile because no user is signed in.');
        return;
      }

      try {
        const existingProfile = await getUserProfile(firestore, uid);
        const defaultProfile = buildDefaultUserProfile();
        setValues(existingProfile ?? defaultProfile);
      } catch (error) {
        console.error('Unable to load user profile: ', error);
        setErrorMessage('Unable to load your profile right now. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [auth, firestore]);

  const setTargetName = (value: string) => {
    setLatestSuccessMessage(null);
    setValues((current) => ({ ...current, targetName: value }));
  };

  const setTimezone = (value: string) => {
    setLatestSuccessMessage(null);
    setValues((current) => ({ ...current, timezone: value }));
  };

  const setDefaultCalendarId = (value: string) => {
    setLatestSuccessMessage(null);
    setValues((current) => ({ ...current, defaultCalendarId: value }));
  };

  const setReminderEnabled = (value: boolean) => {
    setLatestSuccessMessage(null);
    setValues((current) => ({
      ...current,
      reminder: {
        ...current.reminder,
        enabled: value,
      },
    }));
  };

  const setReminderMinutesBefore = (value: number) => {
    setLatestSuccessMessage(null);
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

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setErrorMessage('Unable to save profile because no user is signed in.');
      return false;
    }

    setIsSubmitting(true);
    try {
      await saveUserProfile(firestore, uid, values);
      setLatestSuccessMessage(successMessage);
      return true;
    } catch (error) {
      console.error('Unable to save profile: ', error);
      setErrorMessage('Unable to save your profile right now. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return useMemo(() => ({
    values,
    errors,
    isLoading,
    isSubmitting,
    errorMessage,
    successMessage: latestSuccessMessage,
    setTargetName,
    setTimezone,
    setDefaultCalendarId,
    setReminderEnabled,
    setReminderMinutesBefore,
    submit,
  }), [
    values,
    errors,
    isLoading,
    isSubmitting,
    errorMessage,
    latestSuccessMessage,
  ]);
};

export { useUserProfileForm };
export type { UseUserProfileFormResult };
