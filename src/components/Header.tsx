import React from 'react';
import { AuthBadge } from './AuthBadge';
import { UsageCounter } from './UsageCounter';
import { User } from '../firebase/config';

interface HeaderProps {
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="header card">
      <div className="logo-group">
        {/* GDG 4-dot logo mark */}
        <div className="logo-icon" aria-hidden="true">
          <span className="logo-dot-1" />
          <span className="logo-dot-2" />
          <span className="logo-dot-3" />
          <span className="logo-dot-4" />
        </div>
        <div className="logo-text">
          <h1 className="header-title">AI Study Assistant</h1>
          <div className="header-subtitle">
            <span className="header-badge">DevFest Ado-Ekiti 2026</span>
            {/* <span className="header-stack">Gemini · Firebase AI Logic</span> */}
          </div>
        </div>
      </div>

      <div className="header-controls">
        <UsageCounter />
        <AuthBadge user={user} />
      </div>
    </header>
  );
};
