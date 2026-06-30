import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readEnv(): FirebaseEnv | null {
  const env: FirebaseEnv = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
  // Minimum required for Firestore.
  if (!env.apiKey || !env.projectId || !env.appId) return null;
  return env;
}

/** True when all required Firebase env vars are present. */
export function isFirebaseConfigured(): boolean {
  return readEnv() !== null;
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp;
  const env = readEnv();
  if (!env) return null;
  try {
    cachedApp = getApps().length ? getApp() : initializeApp(env);
    return cachedApp;
  } catch {
    return null;
  }
}

export function getFirestoreDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch {
    return null;
  }
}
