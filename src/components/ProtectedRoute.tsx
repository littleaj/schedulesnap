import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth, useFirestore } from '@/hooks/firebase';
import { getUserProfile, isUserProfileComplete } from '@/services/user-profile';

const ONBOARDING_ALLOWED_PATHS = new Set(['/onboarding', '/settings', '/logout']);

const ProtectedRoute = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setHasCompletedOnboarding(false);
        setIsChecking(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    void (async () => {
      try {
        if (!user) {
          return;
        }
        const profile = await getUserProfile(firestore, user.uid);
        const completedProfile = isUserProfileComplete(profile);
        console.log("Profile complete? ", completedProfile);
        setHasCompletedOnboarding(completedProfile);
      } catch (error) {
        console.error('Unable to verify onboarding status: ', error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    })();
  }, [firestore, user]);

  if (isChecking) {
    return <div>Checking session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAllowedOnboardingPath = ONBOARDING_ALLOWED_PATHS.has(location.pathname);

  if (!hasCompletedOnboarding && !isAllowedOnboardingPath) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
