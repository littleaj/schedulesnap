import React, { useMemo } from "react";

export interface GoogleOAuthControls {
  getToken: () => string | null;
  getTokenExpiresAt: () => number | null;
  setToken: (token: string | null) => void;
  setTokenExpiresAt: (expiresAt: number | null) => void;
}

export const GoogleOAuthTokenContext = React.createContext<GoogleOAuthControls>({} as GoogleOAuthControls);

const STORAGE_KEYS = {
  TOKEN: 'googleOAuthToken',
  TOKEN_EXPIRES_AT: 'googleOAuthTokenExpiresAt',
};

export const GoogleOAuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const getToken = () => sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  const setToken = (token: string | null) => {
    if (!token) {
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      return;
    }
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
  };
  const getTokenExpiresAt = () => {
    const expiresAt = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    return expiresAt ? Number.parseInt(expiresAt, 10) : null;
  };

  const setTokenExpiresAt = (expiresAt: number | null) => {
    if (expiresAt === null) {
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      return;
    }
    sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
  };

  const controls = useMemo(() => ({ getToken, setToken, getTokenExpiresAt, setTokenExpiresAt }), []);

  return (
    <GoogleOAuthTokenContext.Provider value={controls}>
      {children}
    </GoogleOAuthTokenContext.Provider>
  );
};
