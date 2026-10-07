import type { UserProfile } from '@/types/user-profile';

export const resolveShiftName = (
  profile: Pick<UserProfile, 'defaultShiftName' | 'namePrefix'>,
  extractedName?: string | null,
): string => {
  const prefix = profile.namePrefix ?? '';
  const trimmedName = extractedName?.trim() ?? '';
  const withoutPrefix = prefix && trimmedName.startsWith(prefix)
    ? trimmedName.slice(prefix.length)
    : trimmedName;
  const baseName = withoutPrefix || profile.defaultShiftName.trim() || 'Work';

  return `${prefix}${baseName}`;
};
