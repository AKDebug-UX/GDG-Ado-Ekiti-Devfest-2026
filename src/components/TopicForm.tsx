import React, { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface TopicFormProps {
  onGenerate: (topic: string) => void;
  isLoading: boolean;
}

/**
 * ============================================================================
 * TOPIC INPUT FORM COMPONENT (TopicForm.tsx)
 * ============================================================================
 * 
 * Styled with DevFest Ado-Ekiti '26 aesthetics:
 * - Real GDG small logo badge (/gdg-small-logo.png)
 * - Brand typography and colors (GDG Yellow, Red, Blue, Green)
 * - Neo-brutalist 2px ink borders with 8px hard drop shadows
 * ============================================================================
 */

// Curated quick topics directly based on the DevFest talk:
// "Building AI-Powered Web Applications with Gemini API and Firebase"
const PRESET_TOPICS = [
  'Gemini API Structured Outputs (JSON Schema)',
  'Real-Time Firestore Sync with onSnapshot',
  'Protecting AI Quotas with Firebase App Check',
  'Frictionless Firebase Anonymous Authentication',
  'Handling Gemini 503 Retries & Rate Limits',
  'Firestore Atomic FieldValue.increment()',
];

export const TopicForm: React.FC<TopicFormProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onGenerate(topic.trim());
    }
  };

  return (
    <div className="prompt-card card">
      {/* ── REAL GDG LOGO BANNER (Matches DevFest countdown header) ── */}
      <div className="devfest-hero-badge">
        <img
          src="/gdg-small-logo.png"
          alt="GDG Logo"
          width="24"
          height="14"
          className="badge-gdg-logo"
        />
        <span className="badge-text">BUILDING AI APPS WITH GEMINI & FIREBASE</span>
        <img
          src="/gdg-small-logo.png"
          alt="GDG Logo"
          width="24"
          height="14"
          className="badge-gdg-logo"
        />
      </div>

      <h2 className="prompt-title">
        What do you want to learn at <span className="devfest-highlight">DevFest’<span className="text-gdg-red">2</span><span className="text-gdg-blue">6</span></span>?
      </h2>
      <p className="prompt-subtitle">
        Explore core topics from our talk on <strong>Building AI-Powered Web Applications with Gemini API and Firebase</strong>. Click a quick topic or ask any custom question.
      </p>

      {/* ── CUSTOM SEARCH FORM ── */}
      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            id="topic-input"
            type="text"
            className="topic-input"
            placeholder="e.g. How does Gemini API Structured Outputs work with Firebase?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />

          {/* Submit button with loading spinner state */}
          <button
            id="generate-btn"
            type="submit"
            className="generate-btn press"
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Generating…</span>
              </>
            ) : (
              <>
                <span>Ask Gemini</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── ONE-CLICK PRESET PILLS FOR LIVE DEMOS ── */}
      <div className="preset-pills">
        <span className="pill-label">
          <Zap size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Quick topics:
        </span>
        {PRESET_TOPICS.map((item, idx) => (
          <button
            key={idx}
            className={`preset-pill pill-color-${idx % 4} press`}
            onClick={() => {
              setTopic(item);
              onGenerate(item);
            }}
            disabled={isLoading}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};


