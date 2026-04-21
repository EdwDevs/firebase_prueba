import { initializeApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId,
)

let appInstance: FirebaseApp | null = null
let dbInstance: Firestore | null = null

if (isFirebaseConfigured) {
  appInstance = initializeApp(config)
  dbInstance = getFirestore(appInstance)
}

export const firebaseApp = appInstance
export const db = dbInstance
