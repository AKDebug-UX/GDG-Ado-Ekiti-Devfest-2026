import React from 'react';
import { Clock, Database } from 'lucide-react';
import { StudySession } from '../types/study';

interface HistoryDrawerProps {
  sessions: StudySession[];
  onSelectSession: (session: StudySession) => void;
  isLoading: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ sessions, onSelectSession, isLoading }) => {
  return (
    <div className="history-panel card">
      <div className="history-title">
        <span className="history-title-text">
          <Clock size={13} />
          Session History
        </span>
        <span className="history-source">
          <Database size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
          Firestore
        </span>
      </div>

      {isLoading ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.83rem', color: 'var(--t3)' }}>No saved sessions yet.</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: '0.25rem' }}>
            Sessions save automatically after generation.
          </p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session, idx) => (
            <div
              key={session.id || idx}
              className="session-item"
              onClick={() => onSelectSession(session)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectSession(session)}
            >
              <div className="session-topic">{session.topic}</div>
              <div className="session-date">
                {session.createdAt
                  ? new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Saved'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
