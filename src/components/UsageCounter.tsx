import React, { useEffect, useState } from 'react';
import { subscribeToUsageStats, UsageStats } from '../services/aiService';

const DAILY_LIMIT = 500;

export const UsageCounter: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const unsub = subscribeToUsageStats((s) => {
      setStats((prev) => {
        if (prev !== null && s.totalSessions !== prev.totalSessions) {
          setBump(true);
          setTimeout(() => setBump(false), 500);
        }
        return s;
      });
    });
    return () => unsub();
  }, []);

  if (stats === null) return null;

  const count = stats.totalSessions;
  const pct = Math.min((count / DAILY_LIMIT) * 100, 100);
  const barColor =
    pct >= 90 ? 'var(--danger)' :
    pct >= 65 ? 'var(--warning)' :
    'var(--gdg-blue)';

  return (
    <div id="usage-counter" className="usage-counter" title={`${count} of ${DAILY_LIMIT} daily requests used`}>
      <span
        className="usage-count"
        style={{
          color: barColor,
          display: 'inline-block',
          transform: bump ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {count}
      </span>
      <span className="usage-sep">/</span>
      <span className="usage-limit">{DAILY_LIMIT}</span>

      <div className="usage-bar-wrap">
        <div
          className="usage-bar-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      <span className="usage-label">req today</span>
    </div>
  );
};
