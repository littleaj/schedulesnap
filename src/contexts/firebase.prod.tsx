import React from "react";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6Lf7L6stAAAAABN-_TqQiV3vOmxOwO7P-mt28T5j'),
  isTokenAutoRefreshEnabled: true
});
const firestore = getFirestore(app);
const firebaseServices = {
  analytics: getAnalytics(app),
  auth: getAuth(app),
  firestore,
};
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
