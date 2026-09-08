import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { useAuth } from './firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const useGoogleLogin = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  return async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_EVENTS_SCOPE);

    const credential = await signInWithPopup(auth, provider);
    console.log('Logged in as ' + credential.user.displayName);

    // TODO: query the backend to check if the user has completed onboarding before navigating
    const onboardingComplete = localStorage.getItem('schedule-snap-onboarding-complete') === 'true';
    const nextRoute = onboardingComplete ? '/capture' : '/onboarding';
    navigate(nextRoute, { replace: true });
  };
};

export default useGoogleLogin;
