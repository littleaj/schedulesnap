import React from "react";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

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
const firebaseServices = {
  analytics: getAnalytics(app),
  auth: getAuth(app),
  firestore: getFirestore(app),
};
const FirebaseContext = React.createContext(firebaseServices);

const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <FirebaseContext.Provider value={firebaseServices}>
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseProvider };
export type { FirebaseServices };
