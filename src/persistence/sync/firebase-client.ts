import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isSyncConfigured } from '@/config/env';

let app: FirebaseApp | null = null;

/** Devuelve la app de Firebase (singleton) o `null` si no hay credenciales. */
function getApp(): FirebaseApp | null {
  if (!isSyncConfigured) return null;
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getApp();
  return a ? getAuth(a) : null;
}

export function getDb(): Firestore | null {
  const a = getApp();
  return a ? getFirestore(a) : null;
}
