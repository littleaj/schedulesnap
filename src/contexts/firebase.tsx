import React from "react";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// cSpell:disable
const firebaseConfig = {
  apiKey: "AIzaSyBQbZCx8EIvV7VhyNzjdQxp8xJyFoRuevU",
  authDomain: "schedulesnap-4f86c.firebaseapp.com",
  projectId: "schedulesnap-4f86c",
  storageBucket: "schedulesnap-4f86c.firebasestorage.app",
  messagingSenderId: "453994861265",
  appId: "1:453994861265:web:478635912742dcddbcebf0",
  measurementId: "G-HB7CBPZJRZ"
};
// cSpell:enable

interface FirebaseServices {
  analytics: ReturnType<typeof getAnalytics>;
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
}

const isDevMode = import.meta.env.MODE === 'development';
console.log((isDevMode ? "DEVELOPMENT" : "PRODUCTION") + " MODE");

if (isDevMode) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
}

// Initialize Firebase
console.log("Initializing Firebase app...");
const app = initializeApp(firebaseConfig);

// @ts-ignore
console.log("Initializing Firebase app check... (debug=" + !!self?.FIREBASE_APPCHECK_DEBUG_TOKEN + ")");
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});
console.log("Firebase app check initialized: ", !!appCheck);

const firestore = getFirestore(app);
const firebaseServices = {
  analytics: getAnalytics(app),
  auth: getAuth(app),
  firestore,
};

if (isDevMode) {
  console.log("Development mode: connecting to Firestore emulator...");
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
}

const FirebaseContext = React.createContext(firebaseServices);

const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <FirebaseContext.Provider value={firebaseServices}>
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseProvider, firestore };
export type { FirebaseServices };
