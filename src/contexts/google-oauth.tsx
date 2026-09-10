import React, { useMemo } from "react";

export interface GoogleOAuthControls {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
}

export const GoogleOAuthTokenContext = React.createContext<GoogleOAuthControls>({} as GoogleOAuthControls);

export const GoogleOAuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const getToken = () => sessionStorage.getItem('googleOAuthToken');
  const setToken = (token: string | null) => {
    if (!token) {
      sessionStorage.removeItem('googleOAuthToken');
      return;
    }
    sessionStorage.setItem('googleOAuthToken', token);
  };

  const controls = useMemo(() => ({ getToken, setToken }), []);

  return (
    <GoogleOAuthTokenContext.Provider value={controls}>
      {children}
    </GoogleOAuthTokenContext.Provider>
  );
};
