import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDdwwpkUq6tQbsTTKXUQ_eHR-uYN2ytgKI",
  authDomain: "procafees-pos-socorro-6225a.firebaseapp.com",
  projectId: "procafees-pos-socorro-6225a",
  storageBucket: "procafees-pos-socorro-6225a.firebasestorage.app",
  messagingSenderId: "718064305026",
  appId: "1:718064305026:web:7758ebbcb545f40d86c59b"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

// Tenant ID (para multi-tenant, configurable por env o usuario autenticado)
export const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

// Emuladores (solo desarrollo)
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { app, auth, db, realtimeDb };
