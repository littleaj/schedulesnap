import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithRedirect,
  signInWithRedirect,
  type Auth,
} from 'firebase/auth';
import { useAuth } from '@/hooks/firebase';

const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const ACCESSIBLE_CALENDARS_SCOPE = 'https://www.googleapis.com/auth/calendar.calendars.readonly';
const TOKEN_CACHE_TTL_MS = 55 * 60 * 1000;

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiry = 0;
let redirectResultChecked = false;
let pendingTokenResolver: ((token: string) => void) | null = null;
let pendingTokenRejecter: ((error: Error) => void) | null = null;

const clearCachedToken = () => {
  cachedAccessToken = null;
  cachedAccessTokenExpiry = 0;
};

const hasValidCachedToken = () => {
  return cachedAccessToken !== null && Date.now() < cachedAccessTokenExpiry;
};

const setCachedToken = (token: string) => {
  cachedAccessToken = token;
  cachedAccessTokenExpiry = Date.now() + TOKEN_CACHE_TTL_MS;

  if (pendingTokenResolver) {
    pendingTokenResolver(token);
    pendingTokenResolver = null;
    pendingTokenRejecter = null;
  }
};

const rejectPendingToken = (error: Error) => {
  if (pendingTokenRejecter) {
    pendingTokenRejecter(error);
    pendingTokenResolver = null;
    pendingTokenRejecter = null;
  }
};

const buildCalendarProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_EVENTS_SCOPE);
  provider.addScope(ACCESSIBLE_CALENDARS_SCOPE);
  return provider;
};

const readAccessTokenFromRedirectResult = (auth: Auth): Promise<string | null> => {
  return getRedirectResult(auth)
    .then((result) => {
      if (!result) {
        return null;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken ?? null;
      if (accessToken) {
        setCachedToken(accessToken);
      }

      return accessToken;
    })
    .catch((error: unknown) => {
      const authError = error instanceof Error ? error : new Error('Unable to complete Google Calendar reauthorization.');
      throw authError;
    });
};

/**
 * Keeps a module-scoped Google OAuth access token in-memory for the life of the page session.
 *
 * Because this app is browser-only and has no backend, the token cache is intentionally not
 * persisted to localStorage/sessionStorage or Firestore. When the cached token expires, the app
 * reauthenticates with Google via redirect-based OAuth and stores the fresh access token until it
 * is invalidated again. This avoids the Firebase ID token misuse that would otherwise fail the
 * Calendar API.
 */
export const useGoogleCalendarToken = () => {
  const auth = useAuth();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        clearCachedToken();
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (redirectResultChecked) {
      return;
    }

    redirectResultChecked = true;

    (async () => {
      try {
        const nextToken = await readAccessTokenFromRedirectResult(auth);
        if (nextToken) {
          setAuthError(null);
        }
      } catch (error) {
        const nextError = error instanceof Error ? error : new Error('Google Calendar reauthorization failed.');
        setAuthError(nextError);
      }
    })();
  }, [auth]);

  const clearToken = () => {
    clearCachedToken();
    setAuthError(null);
  };

  const getAccessToken = async (): Promise<string> => {
    if (hasValidCachedToken() && cachedAccessToken) {
      return cachedAccessToken;
    }

    setAuthError(null);
    setIsAuthorizing(true);

    try {
      const provider = buildCalendarProvider();
      const waitForFreshToken = () => new Promise<string>((resolve, reject) => {
        if (hasValidCachedToken() && cachedAccessToken) {
          resolve(cachedAccessToken);
          return;
        }

        pendingTokenResolver = resolve;
        pendingTokenRejecter = reject;
      });

      const freshTokenPromise = waitForFreshToken();

      if (auth.currentUser) {
        await reauthenticateWithRedirect(auth.currentUser, provider);
      } else {
        await signInWithRedirect(auth, provider);
      }

      const token = await freshTokenPromise;
      if (!token) {
        throw new Error('No Google Calendar access token was returned.');
      }

      return token;
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error('Unable to request a Google Calendar access token.');
      setAuthError(nextError);
      rejectPendingToken(nextError);
      throw nextError;
    } finally {
      setIsAuthorizing(false);
    }
  };

  return {
    getAccessToken,
    isAuthorizing,
    authError,
    clearToken,
  };
};

export { clearCachedToken };
