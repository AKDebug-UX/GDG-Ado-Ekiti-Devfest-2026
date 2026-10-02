import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db, collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, increment, onSnapshot } from '../firebase/config';
import { GeneratedStudyData, StudySession } from '../types/study';

/**
 * ============================================================================
 * AI & FIRESTORE SERVICE LAYER (aiService.ts)
 * ============================================================================
 * 
 * Key Presentation Concepts:
 * 1. Google Gemini API via @google/generative-ai SDK.
 * 2. Gemini "Structured Outputs" (JSON Schema mode) — guarantees valid JSON
 *    structure directly from the model without fragile regex parsing.
 * 3. Resilient Error Handling — includes exponential backoff retries for 503
 *    high-demand load spikes.
 * 4. Cloud Firestore Integration:
 *    - User-scoped subcollections: users/{userId}/study_sessions
 *    - Atomic FieldValue increment for the global event usage counter.
 *    - Real-time updates via Firestore onSnapshot listener.
 * ============================================================================
 */

// ─── GEMINI CLIENT INITIALIZATION ───────────────────────────────────────────
// Reads API key securely from Vite environment variables (VITE_GEMINI_API_KEY)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * GENERATE STUDY MATERIAL (Gemini 2.5/Flash-Lite)
 * 
 * How to explain:
 * - We request a structured study package for any user topic.
 * - By providing `responseSchema`, we enforce that Gemini returns exactly:
 *   topic, explanation, keyPoints (array of 3), practicalExample,
 *   quizQuestions (array of 3 objects), and challenge.
 */
export async function generateStudyMaterial(topic: string): Promise<GeneratedStudyData> {
  // 1. Configure the model with Structured Outputs schema
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      // Directs Gemini to produce JSON rather than markdown text
      responseMimeType: "application/json",
      // Strict JSON Schema: guarantees that all fields and types exist
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          keyPoints: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          practicalExample: { type: SchemaType.STRING },
          quizQuestions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING },
                options: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                },
                answerIndex: { type: SchemaType.INTEGER },
                explanation: { type: SchemaType.STRING }
              },
              required: ["question", "options", "answerIndex", "explanation"]
            }
          },
          challenge: { type: SchemaType.STRING }
        },
        required: ["topic", "explanation", "keyPoints", "practicalExample", "quizQuestions", "challenge"]
      }
    }
  });

  // 2. Clear instructions in the prompt complementing the schema
  const prompt = `Topic/Question: ${topic}
Please generate a complete study package for this topic containing:
1. Clear simple explanation.
2. 3 key summary points.
3. 1 practical real-world example.
4. 3 multiple-choice quiz questions with 4 options each, the 0-indexed correct answer, and an explanation.
5. 1 practical student challenge.`;

  let lastError: any = null;

  // 3. Retry loop with Exponential Backoff (Handles temporary 503 high-demand surges)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Send request to Gemini
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      // Because we used responseSchema, responseText is guaranteed valid JSON
      return JSON.parse(responseText) as GeneratedStudyData;
    } catch (err: any) {
      lastError = err;
      // Check if the error is a temporary 503 Service Unavailable / High demand spike
      const is503 =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('high demand');

      // Retry up to 2 times with a progressive 2-5s delay
      if (is503 && attempt < 2) {
        const delay = (attempt + 1) * 2000 + Math.random() * 1000;
        console.warn(`Gemini 503 — high demand (attempt ${attempt + 1}/3). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      break;
    }
  }

  // If retries fail or an unrecoverable error occurs, rethrow it
  throw lastError;
}

// ─── FIRESTORE CRUD OPERATIONS ──────────────────────────────────────────────

/**
 * SAVE STUDY SESSION TO CLOUD FIRESTORE
 * 
 * How to explain:
 * - Stores sessions under `users/{userId}/study_sessions/{sessionId}`.
 * - This provides isolated, secure, per-user storage in Firestore.
 */
export async function saveStudySession(userId: string, sessionData: GeneratedStudyData): Promise<string | null> {
  try {
    const userSessionsRef = collection(db, `users/${userId}/study_sessions`);
    const docRef = await addDoc(userSessionsRef, {
      ...sessionData,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.warn("Firestore save skipped or in test mode:", error);
    return null;
  }
}

/**
 * GET RECENT STUDY SESSIONS FROM CLOUD FIRESTORE
 * 
 * How to explain:
 * - Queries the 10 most recent study sessions for the authenticated user.
 * - Ordered by timestamp descending (`createdAt: 'desc'`).
 */
export async function getSavedSessions(userId: string): Promise<StudySession[]> {
  try {
    const userSessionsRef = collection(db, `users/${userId}/study_sessions`);
    const q = query(userSessionsRef, orderBy('createdAt', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);

    const sessions: StudySession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      } as StudySession);
    });

    return sessions;
  } catch (error) {
    console.warn("Firestore fetch error/fallback:", error);
    return [];
  }
}

// ─── GLOBAL REAL-TIME USAGE COUNTER ─────────────────────────────────────────

// Firestore document path tracking aggregated usage across all DevFest participants
const STATS_DOC = doc(db, 'app_stats', 'usage');

/**
 * INCREMENT USAGE COUNTER ATOMICALLY
 * 
 * How to explain:
 * - Uses Firestore's `increment(1)` operator so multiple concurrent conference
 *   attendees never overwrite each other's counts (no race conditions).
 */
export async function incrementUsageCounter(): Promise<void> {
  try {
    await setDoc(STATS_DOC, {
      totalSessions: increment(1),
      lastUpdated: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('Usage counter update failed (non-critical):', err);
  }
}

export interface UsageStats {
  totalSessions: number;
  lastUpdated: number | null;
}

/**
 * SUBSCRIBE TO REAL-TIME USAGE STATS
 * 
 * How to explain:
 * - Leverages Firebase `onSnapshot` for real-time WebSocket-like synchronization.
 * - When any attendee generates content, all connected clients receive the update instantly.
 */
export function subscribeToUsageStats(callback: (stats: UsageStats) => void): () => void {
  return onSnapshot(STATS_DOC, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        totalSessions: data.totalSessions ?? 0,
        lastUpdated: data.lastUpdated ?? null
      });
    } else {
      callback({ totalSessions: 0, lastUpdated: null });
    }
  }, (err) => {
    console.warn('Usage stats listener error:', err);
  });
}

