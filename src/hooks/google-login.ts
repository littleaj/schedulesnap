import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { useAuth, useFirestore } from './firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export const useGoogleLogin = () => {
  const auth = useAuth();

  return async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_EVENTS_SCOPE);

    await signInWithRedirect(auth, provider);
  };
};
