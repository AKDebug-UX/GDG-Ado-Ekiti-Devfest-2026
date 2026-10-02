import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TopicForm } from './components/TopicForm';
import { StudySessionView } from './components/StudySessionView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { auth, signInAnonymously, onAuthStateChanged, User } from './firebase/config';
import { generateStudyMaterial, saveStudySession, getSavedSessions, incrementUsageCounter } from './services/aiService';
import { StudySession } from './types/study';
import { Sparkles } from 'lucide-react';

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT (App.tsx)
 * ============================================================================
 * 
 * Role in Architecture:
 * - Central orchestrator for the AI Study Assistant.
 * - Coordinates:
 *   1. Anonymous Firebase Authentication (identifies the user seamlessly).
 *   2. Gemini AI generation (calls aiService with the requested topic).
 *   3. Firestore Persistence (saves and retrieves previous study sessions).
 *   4. UI State (active session, loading indicators, error handling).
 * ============================================================================
 */
export function App() {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────────────────
  // Holds the current authenticated Firebase user (anonymous session)
  const [user, setUser] = useState<User | null>(null);

  // Holds the currently active study session shown on the main screen
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);

  // Holds the list of past sessions fetched from Cloud Firestore for this user
  const [savedSessions, setSavedSessions] = useState<StudySession[]>([]);

  // Loading state while Gemini AI generates the study package
  const [isLoading, setIsLoading] = useState(false);

  // Loading state while fetching past study history from Firestore
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Banner error message for network issues, auth failures, or API limits
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── 1. AUTHENTICATION LIFECYCLE (Firebase Auth) ───────────────────────────
  // When the app mounts, check if the user is signed in.
  // If not, sign them in anonymously so they get a unique UID without typing a password.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User already has an active session
        console.log("✅ Auth user:", currentUser.uid);
        setUser(currentUser);
        loadHistory(currentUser.uid);
      } else {
        // First-time visit: Create an anonymous Firebase account
        try {
          const userCredential = await signInAnonymously(auth);
          console.log("✅ Anonymous sign-in success:", userCredential.user.uid);
          setUser(userCredential.user);
          loadHistory(userCredential.user.uid);
        } catch (err: any) {
          console.error("❌ Anonymous auth failed:", err);
          setErrorMsg(`Auth failed: ${err?.message || 'Anonymous sign-in error'}. Check Firebase Console → Authentication → Sign-in providers → Anonymous must be enabled.`);
        }
      }
    });

    // Cleanup auth subscription on unmount
    return () => unsubscribe();
  }, []);

  // ─── 2. LOAD USER HISTORY FROM FIRESTORE ──────────────────────────────────
  // Fetches previous study sessions belonging to the current user's UID
  const loadHistory = async (userId: string) => {
    setIsHistoryLoading(true);
    const sessions = await getSavedSessions(userId);
    setSavedSessions(sessions);
    setIsHistoryLoading(false);
  };

  // ─── 3. CORE ACTION: GENERATE STUDY PACKAGE WITH GEMINI ────────────────────
  // Triggered when user enters a topic or clicks a quick-topic pill
  const handleGenerate = async (topic: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Step A: Call Gemini AI via Google Generative AI SDK with Structured Outputs
      const generatedData = await generateStudyMaterial(topic);
      
      // Step B: Wrap response with metadata (timestamp, user ID)
      const newSession: StudySession = {
        ...generatedData,
        createdAt: Date.now(),
        userId: user?.uid
      };

      // Step C: Update UI immediately so the user can begin studying
      setCurrentSession(newSession);

      // Step D: Atomically increment global usage counter in Firestore (non-blocking)
      incrementUsageCounter();

      // Step E: Persist this session into user's Firestore collection for later retrieval
      if (user?.uid) {
        console.log("💾 Saving to Firestore for user:", user.uid);
        const docId = await saveStudySession(user.uid, generatedData);
        if (docId) {
          console.log("✅ Session saved with ID:", docId);
          newSession.id = docId;
          // Refresh the sidebar history list
          loadHistory(user.uid);
        } else {
          console.warn("⚠️ Firestore save returned null — check Firestore rules or App Check.");
        }
      } else {
        console.warn("⚠️ No authenticated user — session not saved to Firestore.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMsg(err?.message || "Failed to generate AI response. Please check your network or API setup.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 4. RENDER UI ──────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      {/* Decorative hero shapes from devfest.gdgadoekiti.com */}
      <img
        src="/shape-pink-2.svg"
        alt=""
        aria-hidden="true"
        className="decorative-shape shape-pink-2"
      />
      <img
        src="/shape-pink-1.svg"
        alt=""
        aria-hidden="true"
        className="decorative-shape shape-pink-1"
      />
      <img
        src="/shape-green.svg"
        alt=""
        aria-hidden="true"
        className="decorative-shape shape-green"
      />

      <div className="app-container">
        {/* Top navigation with DevFest branding, live usage counter, and auth status */}
        <Header user={user} />

        {/* Emergency / troubleshooting alert banner if any service encounters an error */}
        {errorMsg && (
          <div className="emergency-banner">
            {errorMsg}
          </div>
        )}

        {/* Input box and quick-select topic buttons */}
        <TopicForm onGenerate={handleGenerate} isLoading={isLoading} />

        {/* Main 2-column layout: Left = Active Study Session, Right = History sidebar */}
        <div className="layout-grid">
          {/* Left Column: Active study content or welcoming empty state */}
          <main>
            {currentSession ? (
              <StudySessionView session={currentSession} />
            ) : (
              <div className="card empty-state">
                <div className="empty-state-icon">
                  <Sparkles size={28} />
                </div>
                <h3 className="empty-state-title">
                  Ready to learn something new?
                </h3>
                <p className="empty-state-text">
                  Pick one of the quick topics above or enter your own question — Gemini and Firebase AI Logic will build a complete study package in seconds.
                </p>
              </div>
            )}
          </main>

          {/* Right Column: List of saved sessions stored in Cloud Firestore */}
          <aside>
            <HistoryDrawer
              sessions={savedSessions}
              onSelectSession={(session) => setCurrentSession(session)}
              isLoading={isHistoryLoading}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;

