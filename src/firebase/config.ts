import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { getVertexAI, getGenerativeModel, SchemaType } from 'firebase/vertexai';

/**
 * ============================================================================
 * FIREBASE INFRASTRUCTURE & CONFIGURATION (config.ts)
 * ============================================================================
 * 
 * Key Presentation Concepts:
 * 1. Firebase Core Initialization:
 *    - Uses environment variables (VITE_FIREBASE_*) so secrets aren't hardcoded.
 *    - Reuses existing instance if already initialized (getApps check).
 * 
 * 2. Firebase App Check:
 *    - Protects your backend, Firestore, and AI quotas from bots and abuse.
 *    - Uses reCAPTCHA Enterprise for production and a debug token for local dev.
 * 
 * 3. Firebase Authentication:
 *    - Anonymous Auth gives every attendee a unique user ID (`uid`) instantly
 *      without requiring social logins or password registration forms.
 * 
 * 4. Cloud Firestore:
 *    - NoSQL real-time document database storing user sessions and live stats.
 * 
 * 5. Firebase AI Logic (Vertex AI in Firebase):
 *    - Direct client SDK access to Google Cloud Vertex AI models.
 * ============================================================================
 */

// ─── 1. FIREBASE PROJECT CONFIGURATION ──────────────────────────────────────
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

// ─── 2. LOCAL DEV APP CHECK DEBUG TOKEN ─────────────────────────────────────
// In local development (localhost), we pass a debug token registered in Firebase
// Console so developers don't get blocked by reCAPTCHA during local testing.
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || "D751E3EA-FC98-4D65-9FDB-6C7156FD0678";
}

// ─── 3. INITIALIZE FIREBASE APP INSTANCE ─────────────────────────────────────
// Prevents duplicate app initialization in hot-reload React environments
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── 4. INITIALIZE APP CHECK (reCAPTCHA Enterprise) ──────────────────────────
// Attaches cryptographic attestation tokens to every Firestore & AI request
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

// ─── 5. EXPORT FIREBASE SERVICES ────────────────────────────────────────────
// Firebase Authentication instance (anonymous login)
export const auth = getAuth(app);

// Cloud Firestore database instance
export const db = getFirestore(app);

// ─── 6. FIREBASE AI LOGIC (Vertex AI in Firebase) ───────────────────────────
// Allows calling Gemini models directly with Firebase security and App Check
export let vertexAI: ReturnType<typeof getVertexAI> | null = null;

try {
  vertexAI = getVertexAI(app);
} catch (error) {
  console.warn("Firebase AI Logic (Vertex AI) initialization deferred or using fallback:", error);
}

// Re-export common Firestore & AI utilities for convenience across components
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

