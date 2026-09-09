import { connectFirestoreEmulator } from "firebase/firestore";

// @ts-ignore
self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.APPCHECK_DEBUG_TOKEN;
const { firestore } = await import("./firebase.prod");

console.log("Development mode: connecting to Firestore emulator");
connectFirestoreEmulator(firestore, "127.0.0.1", 8080);

export { FirebaseContext, FirebaseProvider } from "./firebase.prod";
export type { FirebaseServices } from "./firebase.prod";
