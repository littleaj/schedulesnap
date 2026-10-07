import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentData } from 'firebase/firestore';
import {
  buildDefaultUserProfile,
  getUserProfile,
  isUserProfileComplete,
  resolveShiftName,
  saveUserProfile,
} from './user-profile';

const {
  docMock,
  getDocMock,
  setDocMock,
} = vi.hoisted(() => ({
  docMock: vi.fn(),
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    doc: docMock,
    getDoc: getDocMock,
    setDoc: setDocMock,
  };
});

describe('userProfileService', () => {
  const firestoreMock = {} as never;

  beforeEach(() => {
    docMock.mockReset();
    getDocMock.mockReset();
    setDocMock.mockReset();
    docMock.mockReturnValue('doc-ref');
  });

  it('returns null when no profile document exists', async () => {
    getDocMock.mockResolvedValue({ exists: () => false });

    const profile = await getUserProfile(firestoreMock, 'uid-123');

    expect(profile).toBeNull();
    expect(docMock).toHaveBeenCalledWith(firestoreMock, 'users', 'uid-123');
  });

  it('normalizes and returns an existing profile document', async () => {
    const data: DocumentData = {
      targetName: 'Alex',
      timezone: 'America/New_York',
      defaultCalendarId: 'primary',
      defaultShiftName: 'Work',
      namePrefix: 'Retail - ',
      reminder: {
        enabled: true,
        minutesBefore: 30,
      },
    };

    getDocMock.mockResolvedValue({ exists: () => true, data: () => data });

    const profile = await getUserProfile(firestoreMock, 'uid-123');

    expect(profile).toEqual(data);
    expect(isUserProfileComplete(profile)).toBe(true);
  });

  it('fills in silent defaults for missing default shift naming fields', () => {
    const sanitized = buildDefaultUserProfile('UTC');

    expect(sanitized.defaultShiftName).toBe('Work');
    expect(sanitized.namePrefix).toBe('');
    expect(resolveShiftName(sanitized, 'Morning Shift')).toBe('Morning Shift');
    expect(resolveShiftName(sanitized, '')).toBe('Work');
    expect(resolveShiftName({ ...sanitized, namePrefix: 'Retail - ' }, '')).toBe('Retail - Work');
    expect(resolveShiftName({ ...sanitized, namePrefix: 'Retail - ' }, 'Retail - Morning Shift')).toBe('Retail - Morning Shift');
  });

  it('saves the profile with merge semantics', async () => {
    const profile = buildDefaultUserProfile('UTC');

    await saveUserProfile(firestoreMock, 'uid-123', profile);

    expect(setDocMock).toHaveBeenCalledWith('doc-ref', profile, { merge: true });
  });

  it('builds default profile with first token from displayName', () => {
    const profile = buildDefaultUserProfile('UTC', 'Alex Johnson');

    expect(profile.targetName).toBe('Alex');
  });

  it('builds default profile with empty targetName when displayName is missing', () => {
    const profile = buildDefaultUserProfile('UTC', null);

    expect(profile.targetName).toBe('');
  });

  it('marks incomplete profile data as incomplete', () => {
    const incompleteProfile = {
      targetName: '',
      timezone: 'UTC',
      defaultCalendarId: 'primary',
      defaultShiftName: 'Work',
      namePrefix: '',
      reminder: {
        enabled: true,
        minutesBefore: 60,
      },
    };

    expect(isUserProfileComplete(incompleteProfile)).toBe(false);
  });
});
