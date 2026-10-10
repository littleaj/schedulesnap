export interface UserProfileReminder {
  enabled: boolean;
  minutesBefore: number;
}

export interface UserProfile {
  targetName: string;
  timezone: string;
  reminder: UserProfileReminder;
  defaultCalendarId: string;
  defaultShiftName: string;
  namePrefix: string;
}

export interface UserProfileValidationErrors {
  targetName?: string;
  timezone?: string;
  defaultCalendarId?: string;
  defaultShiftName?: string;
  reminderMinutesBefore?: string;
}
