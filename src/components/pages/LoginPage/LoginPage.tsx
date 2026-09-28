import React, { useState } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import { useGoogleLogin } from '@/hooks/google-login';
import './LoginPage.css';
import useCurrentUser from '@/hooks/current-user';
import { Navigate, useLocation } from 'react-router';
import PageContent from '@/components/templates/PageContent';
import { Card } from '@/components/atoms/Card';

const LoginPage = () => {
  const user = useCurrentUser();
  const { authenticate: loginWithGoogle } = useGoogleLogin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Unable to sign in with Google: ', error);
      const message = error instanceof Error ? error.message : 'Unable to sign in with Google right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  return (
    <PageContent className="login-page">
      <Card className="login-card" aria-labelledby="login-title">
        <div className="login-card__badge">Google access required</div>
        <h1 id="login-title">Sign in to ScheduleSnap</h1>

        <p className="login-card__intro">
          ScheduleSnap needs access to your Google Calendar so it can create and confirm your shift entries.
        </p>

        <ul className="login-card__benefits" aria-label="What access is needed">
          <li>Read your calendars to avoid duplicate shifts</li>
          <li>Create events directly from extracted schedule details</li>
          <li>Set reminder notifications based on your preferences</li>
        </ul>

        <ActionButton
          variant="primary"
          className="login-card__button"
          type="button"
          id="login-button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Continue with Google'}
        </ActionButton>

        {errorMessage ? (
          <p className="login-card__error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <p className="login-card__footnote">
          ScheduleSnap needs access to your Google Calendar to create events. If you decline access, the app will stay locked until permission is granted.
        </p>
      </Card>
    </PageContent>
  );
};

export default LoginPage;
