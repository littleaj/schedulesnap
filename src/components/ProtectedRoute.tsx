import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/hooks/firebase';

const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (isChecking) {
    return <div>Checking session...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
