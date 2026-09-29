import React from 'react';
import { BookOpen, CheckCircle, Code2, Target, HelpCircle } from 'lucide-react';
import { StudySession } from '../types/study';
import { QuizSection } from './QuizSection';

interface StudySessionViewProps {
  session: StudySession;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({ session }) => {
  return (
    <div className="output-card card">

      {/* ── Topic Header ── */}
      <div className="output-header">
        <h2 className="output-topic-title">{session.topic}</h2>
        <div className="output-meta">
          <span className="output-meta-tag tag-blue">Gemini</span>
          <span className="output-meta-tag tag-green">Firebase AI Logic</span>
        </div>
      </div>

      {/* ── Explanation ── */}
      <div className="output-section">
        <div className="section-header">
          <span className="section-icon icon-blue"><BookOpen size={13} /></span>
          Explanation
        </div>
        <p className="explanation-text">{session.explanation}</p>
      </div>

      {/* ── Key Points ── */}
      <div className="output-section">
        <div className="section-header">
          <span className="section-icon icon-green"><CheckCircle size={13} /></span>
          Key Points
        </div>
        <ul className="key-points-list">
          {session.keyPoints.map((point, idx) => (
            <li key={idx} className="key-point-item">
              <span className="point-number">{idx + 1}</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Practical Example ── */}
      <div className="output-section">
        <div className="section-header">
          <span className="section-icon icon-purple"><Code2 size={13} /></span>
          Practical Example
        </div>
        <div className="example-box">{session.practicalExample}</div>
      </div>

      {/* ── Challenge ── */}
      <div className="output-section">
        <div className="section-header">
          <span className="section-icon icon-yellow"><Target size={13} /></span>
          Your Challenge
        </div>
        <div className="challenge-box">{session.challenge}</div>
      </div>

      {/* ── Quiz ── */}
      <div className="output-section">
        <div className="section-header">
          <span className="section-icon icon-cyan"><HelpCircle size={13} /></span>
          Knowledge Check
        </div>
        <QuizSection questions={session.quizQuestions} />
      </div>

    </div>
  );
};
