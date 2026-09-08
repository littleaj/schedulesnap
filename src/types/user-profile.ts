export interface UserProfileReminder {
  enabled: boolean;
  minutesBefore: number;
}

export interface UserProfile {
  targetName: string;
  timezone: string;
  reminder: UserProfileReminder;
  defaultCalendarId: string;
}

export interface UserProfileValidationErrors {
  targetName?: string;
  timezone?: string;
  defaultCalendarId?: string;
  reminderMinutesBefore?: string;
}
