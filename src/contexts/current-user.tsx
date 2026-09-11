import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/hooks/firebase';
import type { User } from 'firebase/auth';

export const CurrentUserContext = React.createContext<User | null>(null);

export const CurrentUserProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, nextUser => {
      console.log("[CurrentUserProvider] Auth state changed", { "user.uid": nextUser?.uid });
      setUser(nextUser ?? null);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
};
