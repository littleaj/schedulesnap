import {
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { UserProfile } from '@/types/user-profile';

export { resolveShiftName } from '@/utils/shift-name';

export const buildDefaultUserProfile = (timezone = 'UTC', displayName: string | null = null, calendarId = 'primary'): UserProfile => ({
  targetName: typeof displayName === 'string' ? (displayName.split(' ')[0] ?? '') : '',
  timezone,
  defaultCalendarId: calendarId,
  defaultShiftName: 'Work',
  namePrefix: '',
  reminder: {
    enabled: false,
    minutesBefore: 30,
  },
});

const sanitizeProfileData = (source: Partial<UserProfile>): UserProfile => {
  const defaults = buildDefaultUserProfile();
  const reminder = source.reminder ?? defaults.reminder;

  return {
    targetName: typeof source.targetName === 'string' ? source.targetName : defaults.targetName,
    timezone: typeof source.timezone === 'string' ? source.timezone : defaults.timezone,
    defaultCalendarId: typeof source.defaultCalendarId === 'string' ? source.defaultCalendarId : defaults.defaultCalendarId,
    defaultShiftName: typeof source.defaultShiftName === 'string' && source.defaultShiftName.trim() ? source.defaultShiftName : defaults.defaultShiftName,
    namePrefix: typeof source.namePrefix === 'string' ? source.namePrefix : defaults.namePrefix,
    reminder: {
      enabled: typeof reminder.enabled === 'boolean' ? reminder.enabled : defaults.reminder.enabled,
      minutesBefore: typeof reminder.minutesBefore === 'number' ? reminder.minutesBefore : defaults.reminder.minutesBefore,
    },
  };
};

export const getUserProfile = async (firestore: Firestore, uid: string) => {
  const userProfileRef = doc(firestore, 'users', uid);
  const userProfileSnapshot = await getDoc(userProfileRef);

  if (!userProfileSnapshot.exists()) {
    return null;
  }

  return sanitizeProfileData(userProfileSnapshot.data());
};

export const saveUserProfile = async (firestore: Firestore, uid: string, profile: UserProfile) => {
  const userProfileRef = doc(firestore, 'users', uid);
  const nextProfile = sanitizeProfileData(profile);

  await setDoc(userProfileRef, nextProfile, { merge: true });
  return nextProfile;
};

export const isUserProfileComplete = (profile: UserProfile | null) => {
  if (!profile) {
    return false;
  }

  if (!profile.targetName.trim()) {
    return false;
  }

  if (!profile.timezone.trim() || !profile.defaultCalendarId.trim()) {
    return false;
  }

  if (profile.reminder.enabled && profile.reminder.minutesBefore <= 0) {
    return false;
  }

  return true;
};
