import React from 'react';
import { AuthBadge } from './AuthBadge';
import { UsageCounter } from './UsageCounter';
import { User } from '../firebase/config';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
}

/**
 * ============================================================================
 * APPLICATION HEADER BAR (Header.tsx)
 * ============================================================================
 * 
 * Styled directly from the official DevFest Ado-Ekiti '26 site (devfest.gdgadoekiti.com):
 * - Real official SVG lockup logo: /logo-lockup.svg
 * - Official GDG Green header card background (#34A853)
 * - Neo-brutalist 2px ink borders with 4px hard drop shadows
 * - Real-time conference usage counter and anonymous auth badge
 * ============================================================================
 */
export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="header-nav">
      {/* ── REAL DEVFEST ADO-EKITI LOGO LOCKUP ── */}
      <div className="header-brand">
        <a href="#top" className="logo-link" title="DevFest Ado-Ekiti '26">
          <img
            src="/logo-lockup.svg"
            alt="DevFest Ado-Ekiti '26"
            className="devfest-logo-img"
          />
        </a>

        <div className="header-app-tag">
          <Sparkles size={13} className="header-tag-icon" />
          <span>AI Study Assistant</span>
        </div>
      </div>

      {/* ── REAL-TIME STATS & AUTH BADGE ── */}
      <div className="header-controls">
        <UsageCounter />
        <AuthBadge user={user} />
      </div>
    </header>
  );
};


