import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { useAuth } from './firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const ACCESSIBLE_CALENDARS_SCOPE = 'https://www.googleapis.com/auth/calendar.calendars.readonly';

export const useGoogleLogin = () => {
  const auth = useAuth();

  return async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_EVENTS_SCOPE);
    provider.addScope(ACCESSIBLE_CALENDARS_SCOPE);

    await signInWithRedirect(auth, provider);
  };
};
