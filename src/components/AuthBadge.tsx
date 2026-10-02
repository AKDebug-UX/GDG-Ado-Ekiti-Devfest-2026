import React from 'react';
import { UserCheck } from 'lucide-react';
import { User } from '../firebase/config';

interface AuthBadgeProps {
  user: User | null;
}

/**
 * ============================================================================
 * FIREBASE AUTH STATUS BADGE (AuthBadge.tsx)
 * ============================================================================
 * 
 * Key Presentation Concept: Frictionless Anonymous Authentication
 * 
 * How to explain:
 * - Shows whether the user is successfully connected with a Firebase UID.
 * - Anonymous Auth gives full Firebase security benefits (App Check + Firestore
 *   Security Rules scoped to `request.auth.uid`) without requiring any friction
 *   or login credentials from the attendee.
 * ============================================================================
 */
export const AuthBadge: React.FC<AuthBadgeProps> = ({ user }) => {
  return (
    <div className="auth-badge" title={user?.uid ?? 'Not authenticated'}>
      <span className="dot-active" />
      <UserCheck size={13} />
      <span>{user ? 'Live Session' : 'Connecting…'}</span>
    </div>
  );
};

