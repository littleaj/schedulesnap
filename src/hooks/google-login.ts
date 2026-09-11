import { GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup, type User, type UserCredential } from 'firebase/auth';
import { useAuth } from './firebase';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';
import { useContext } from 'react';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

// TODO: determine which scope is correct
const ACCESSIBLE_CALENDARS_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.calendars.readonly';
const CALENDAR_LIST_READONLY_SCOPE = 'https://www.googleapis.com/auth/calendar.calendarlist.readonly';

export interface GoogleLoginControls {
  authenticate: (user?: User | null) => Promise<UserCredential>;
}

function buildGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_EVENTS_SCOPE);
  return provider;
}

export const useGoogleLogin = (): GoogleLoginControls => {
  const auth = useAuth();

  const { setToken } = useContext(GoogleOAuthTokenContext);

  const authProvider = buildGoogleAuthProvider();

  const fetchCredential = async (user?: User | null) => {
    if (!user) {
      console.log("Signing in with Google (popup)...");
      return await signInWithPopup(auth, authProvider);
    }
    console.log(`Reauthenticating with Google (popup) for ${user.email} (${user.displayName})`);
    return await reauthenticateWithPopup(user, authProvider);
  };

  const authenticate = async (user?: User | null) => {
    const credential = await fetchCredential(user);

    const oauth = GoogleAuthProvider.credentialFromResult(credential);
    const accessToken = oauth?.accessToken ?? null;

    setToken(null);
    if (accessToken) {
      console.log("Saving access token...")
      setToken(accessToken);
    } else {
      console.log("Clearing access token...");
    }

    return credential;
  };

  return {
    authenticate
  };
};
