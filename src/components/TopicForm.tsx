import React, { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface TopicFormProps {
  onGenerate: (topic: string) => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  'Cloud Firestore Data Modeling',
  'Firebase AI Logic Architecture',
  'TypeScript Generics',
  'OAuth 2.0 & Web Security',
  'React Server Components',
];

export const TopicForm: React.FC<TopicFormProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) onGenerate(topic.trim());
  };

  return (
    <div className="prompt-card card">
      <span className="prompt-label">Study with AI</span>
      <h2 className="prompt-title">What do you want to master?</h2>
      <p className="prompt-subtitle">
        Enter any topic or question — Gemini builds a structured explanation,
        key points, real-world example, and a quiz. Powered by Firebase AI Logic.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            id="topic-input"
            type="text"
            className="topic-input"
            placeholder="e.g. How do Firebase Security Rules work?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            id="generate-btn"
            type="submit"
            className="generate-btn"
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

      <div className="preset-pills">
        <span className="pill-label">
          <Zap size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
          Quick topics
        </span>
        {PRESET_TOPICS.map((item, idx) => (
          <button
            key={idx}
            className="preset-pill"
            onClick={() => { setTopic(item); onGenerate(item); }}
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
