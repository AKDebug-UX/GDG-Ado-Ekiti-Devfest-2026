import React from 'react';
import { UserCheck } from 'lucide-react';
import { User } from '../firebase/config';

interface AuthBadgeProps {
  user: User | null;
}

export const AuthBadge: React.FC<AuthBadgeProps> = ({ user }) => {
  return (
    <div className="auth-badge" title={user?.uid ?? 'Not authenticated'}>
      <span className="dot-active" />
      <UserCheck size={13} />
      <span>{user ? 'Live Session' : 'Connecting…'}</span>
    </div>
  );
};
