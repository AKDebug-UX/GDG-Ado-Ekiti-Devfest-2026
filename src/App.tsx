import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TopicForm } from './components/TopicForm';
import { StudySessionView } from './components/StudySessionView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { auth, signInAnonymously, onAuthStateChanged, User } from './firebase/config';
import { generateStudyMaterial, saveStudySession, getSavedSessions, incrementUsageCounter } from './services/aiService';
import { StudySession } from './types/study';
import { Sparkles } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [savedSessions, setSavedSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Initialize Anonymous Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("✅ Auth user:", currentUser.uid);
        setUser(currentUser);
        loadHistory(currentUser.uid);
      } else {
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
    return () => unsubscribe();
  }, []);

  const loadHistory = async (userId: string) => {
    setIsHistoryLoading(true);
    const sessions = await getSavedSessions(userId);
    setSavedSessions(sessions);
    setIsHistoryLoading(false);
  };

  // 2. Handle Generation Request
  const handleGenerate = async (topic: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const generatedData = await generateStudyMaterial(topic);
      
      const newSession: StudySession = {
        ...generatedData,
        createdAt: Date.now(),
        userId: user?.uid
      };

      setCurrentSession(newSession);

      // Increment global usage counter (non-blocking)
      incrementUsageCounter();

      // Save session to Firestore if user authenticated
      if (user?.uid) {
        console.log("💾 Saving to Firestore for user:", user.uid);
        const docId = await saveStudySession(user.uid, generatedData);
        if (docId) {
          console.log("✅ Session saved with ID:", docId);
          newSession.id = docId;
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

  return (
    <div className="app-container">
      <Header user={user} />

      {errorMsg && (
        <div className="emergency-banner">
          {errorMsg}
        </div>
      )}

      <TopicForm onGenerate={handleGenerate} isLoading={isLoading} />

      <div className="layout-grid">
        <main>
          {currentSession ? (
            <StudySessionView session={currentSession} />
          ) : (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <Sparkles size={22} />
              </div>
              <h3 style={{ color: 'var(--t1)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                Ready to learn something new?
              </h3>
              <p style={{ maxWidth: '380px', margin: '0 auto', fontSize: '0.875rem', color: 'var(--t2)', lineHeight: '1.6' }}>
                Enter a topic above or pick a quick topic — Gemini will build a complete study package in seconds.
              </p>
            </div>
          )}
        </main>

        <aside>
          <HistoryDrawer
            sessions={savedSessions}
            onSelectSession={(session) => setCurrentSession(session)}
            isLoading={isHistoryLoading}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
