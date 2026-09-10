import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { useAuth } from './firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const ACCESSIBLE_CALENDARS_SCOPE = 'https://www.googleapis.com/auth/calendar.calendars.readonly'; // TODO: ensure this is the correct scope

export const useGoogleLogin = () => {
  const auth = useAuth();

  return async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_EVENTS_SCOPE);
    provider.addScope(ACCESSIBLE_CALENDARS_SCOPE);

    console.log("Signing in with Google (redirect)...");
    await signInWithRedirect(auth, provider);
  };
};
