import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { getUserProfile, isUserProfileComplete } from '@/services/user-profile';
import { useAuth, useFirestore } from './firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const useGoogleLogin = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const navigate = useNavigate();

  return async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_EVENTS_SCOPE);

    const credential = await signInWithPopup(auth, provider);
    console.log('Logged in as ' + credential.user.displayName);

    const profile = await getUserProfile(firestore, credential.user.uid);
    const nextRoute = isUserProfileComplete(profile) ? '/capture' : '/onboarding';
    navigate(nextRoute, { replace: true });
  };
};

export default useGoogleLogin;
