import { GoogleAuthProvider, reauthenticateWithRedirect, signInWithRedirect, type User } from 'firebase/auth';
import { useAuth } from './firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const ACCESSIBLE_CALENDARS_SCOPE = 'https://www.googleapis.com/auth/calendar.calendars.readonly'; // TODO: ensure this is the correct scope

export interface GoogleLoginControls {
  /**
   * Will call {@link signInWithRedirect} if no user is signed in, or {@link reauthenticateWithRedirect} if a user is signed in.
   *
   * @param [user] The currently signed-in user, if any.
   */
  authenticate: (user?: User | null) => Promise<never>;
  provider: GoogleAuthProvider;
}

export const useGoogleLogin = (): GoogleLoginControls => {
  const auth = useAuth();

  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_EVENTS_SCOPE);
  provider.addScope(ACCESSIBLE_CALENDARS_SCOPE);


  const authenticate = async (user?: User | null) => {
    if (!user) {
      console.log("Signing in with Google (redirect)...");
      return await signInWithRedirect(auth, provider);
    }
    console.log(`Reauthenticating with Google (redirect) for ${user.email} (${user.displayName})`);
    return await reauthenticateWithRedirect(user, provider);
  };

  return {
    authenticate,
    provider
  };
};
