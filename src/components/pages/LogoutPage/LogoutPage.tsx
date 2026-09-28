import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/firebase';
import PageContent from '@/components/templates/PageContent';
import { Card } from '@/components/atoms/Card';

const LogoutPage = () => {
  const auth = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        console.log("signing out from: ", location.state?.from);
        await signOut(auth);
      } catch (error) {
        console.warn("Unable to sign out: ", error);
        const message = error instanceof Error ? error.message : 'Unable to sign out right now.';
        setErrorMessage(message);
      } finally {
        setIsSigningOut(false);
      }
    };

    handleLogout();
  }, [auth]);

  if (errorMessage) {
    return (
      <main className="login-page">
        <section className="login-card" aria-live="polite">
          <h1>Sign out failed</h1>
          <p className="login-card__error" role="alert">{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (isSigningOut) {
    return (
      <PageContent className="login-page">
        <Card className="login-card" aria-live="polite" element={<section/>}>
          <h1>Signing out</h1>
          <p className="login-card__intro">Please wait while we sign you out of ScheduleSnap.</p>
        </Card>
      </PageContent>
    );
  }

  const dest = location.state?.from.pathname || '/';
  console.log("logged out. Navigating to: ", dest);
  return <Navigate to={dest} replace />;
};

export default LogoutPage;
