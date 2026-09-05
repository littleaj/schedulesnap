import React, { useContext } from "react";
import { FirebaseContext, FirebaseServices } from "../contexts/firebase";

const createHook = <T>(accessor: (services: FirebaseServices) => T) => {
  return () => {
    const ctx = useContext<FirebaseServices>(FirebaseContext);
    if (!ctx) {
      throw new Error("Hook must be used within a FirebaseProvider");
    }
    return accessor(ctx);
  };
};

const useAuth = createHook(services => services.auth);
const useFirestore = createHook(services => services.firestore);
const useAnalytics = createHook(services => services.analytics);

export { useAuth, useFirestore, useAnalytics };
