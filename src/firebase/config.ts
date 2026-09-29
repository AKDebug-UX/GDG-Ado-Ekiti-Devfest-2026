import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { getVertexAI, getGenerativeModel, SchemaType } from 'firebase/vertexai';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Enable App Check debug token for local development mode (localhost)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || "D751E3EA-FC98-4D65-9FDB-6C7156FD0678";
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check with reCAPTCHA Enterprise site key
if (typeof window !== 'undefined') {
  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6Le-fcktAAAAAEBRKqAihkfWcHN-OSAdA528uiOW";
    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  } catch (err) {
    console.warn("App Check initialization notice:", err);
  }
}

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase AI Logic (Vertex AI in Firebase)
export let vertexAI: ReturnType<typeof getVertexAI> | null = null;

try {
  vertexAI = getVertexAI(app);
} catch (error) {
  console.warn("Firebase AI Logic (Vertex AI) initialization deferred or using fallback:", error);
}

export {
  signInAnonymously,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  onSnapshot,
  setDoc,
  increment,
  getGenerativeModel,
  SchemaType
};

export type { User };
