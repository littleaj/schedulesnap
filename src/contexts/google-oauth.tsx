import React from "react";

export interface GoogleOAuthControls {
  token: string | null;
  setToken: (token: string | null) => void;
}

let googleOAuthToken: string | null = null;

export const GoogleOAuthTokenContext = React.createContext<GoogleOAuthControls>({
  token: googleOAuthToken,
  setToken: (token: string | null) => {
    googleOAuthToken = token;
  }
});

export const GoogleOAuthTokenProvider = GoogleOAuthTokenContext.Provider;
