import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/hooks/firebase';
import useCurrentUser from '@/hooks/current-user';

const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const user = useCurrentUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (isChecking) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
