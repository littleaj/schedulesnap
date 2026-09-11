import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth, useFirestore } from '@/hooks/firebase';
import { getUserProfile, isUserProfileComplete } from '@/services/user-profile';

interface UseUserOnboardingStatusResult {
  isChecking: boolean;
  hasCompletedOnboarding: boolean;
}

const useUserOnboardingStatus = (): UseUserOnboardingStatusResult => {
  const auth = useAuth();
  const firestore = useFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setHasCompletedOnboarding(false);
      setIsChecking(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const profile = await getUserProfile(firestore, uid);
        const completedProfile = isUserProfileComplete(profile);

        if (isMounted) {
          setHasCompletedOnboarding(completedProfile);
        }
      } catch (error) {
        console.error('Unable to verify onboarding status: ', error);

        if (isMounted) {
          setHasCompletedOnboarding(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [auth.currentUser?.uid, firestore]);

  useEffect(() => {
    if (isChecking || !auth.currentUser || hasCompletedOnboarding) {
      return;
    }

    navigate('/onboarding', { replace: true, state: { from: location } });
  }, [auth.currentUser, hasCompletedOnboarding, isChecking, location, navigate]);

  return {
    isChecking,
    hasCompletedOnboarding,
  };
};

export { useUserOnboardingStatus };
