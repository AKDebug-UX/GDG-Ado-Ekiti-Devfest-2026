import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db, collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, increment, onSnapshot } from '../firebase/config';
import { GeneratedStudyData, StudySession } from '../types/study';

// Initialize GoogleGenerativeAI SDK using API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generate Study Material using official @google/generative-ai SDK.
 * Strictly calls the live Gemini model. Throws raw API errors directly with zero demo/fallback data.
 */
export async function generateStudyMaterial(topic: string): Promise<GeneratedStudyData> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
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

  const prompt = `Topic/Question: ${topic}
Please generate a complete study package for this topic containing:
1. Clear simple explanation.
2. 3 key summary points.
3. 1 practical real-world example.
4. 3 multiple-choice quiz questions with 4 options each, the 0-indexed correct answer, and an explanation.
5. 1 practical student challenge.`;

  let lastError: any = null;

  // Up to 3 retries with exponential backoff for 503 high demand spikes
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText) as GeneratedStudyData;
    } catch (err: any) {
      lastError = err;
      const is503 =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('high demand');
      if (is503 && attempt < 2) {
        const delay = (attempt + 1) * 2000 + Math.random() * 1000; // 2-3s, 4-5s
        console.warn(`Gemini 503 — high demand (attempt ${attempt + 1}/3). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      break;
    }
  }

  // Strictly throw error — zero demo data or fallback content
  throw lastError;
}

/**
 * Save study session to Cloud Firestore
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
 * Get recent study sessions from Cloud Firestore
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

// ─── Global Usage Counter ───────────────────────────────────────────────────

const STATS_DOC = doc(db, 'app_stats', 'usage');

/**
 * Atomically increment the global session counter in Firestore.
 * Called after every successful generation.
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
 * Subscribe to real-time usage stats from Firestore.
 * Returns an unsubscribe function.
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
