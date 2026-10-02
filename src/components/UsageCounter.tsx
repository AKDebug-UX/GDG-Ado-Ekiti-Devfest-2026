import React, { useEffect, useState } from 'react';
import { subscribeToUsageStats, UsageStats } from '../services/aiService';

// Daily request quota displayed for the DevFest demo
const DAILY_LIMIT = 500;

/**
 * ============================================================================
 * REAL-TIME GLOBAL USAGE COUNTER (UsageCounter.tsx)
 * ============================================================================
 * 
 * Key Presentation Concept: Real-Time Synchronization via Firestore onSnapshot
 * 
 * How to explain:
 * 1. Live Data Binding: Instead of polling the server every few seconds, we
 *    establish an active Firestore snapshot listener.
 * 2. Collaborative Demo: Whenever any audience member in the room generates
 *    a study session, the count increments instantly for everyone watching.
 * 3. Micro-animation: When the number ticks up, a CSS scale 'bump' triggers
 *    to visually draw attention to the live collaborative event.
 * 4. Dynamic Color Thresholds:
 *    - < 65%: GDG Blue (healthy)
 *    - 65% - 89%: Yellow (warning)
 *    - >= 90%: Red (approaching limit)
 * ============================================================================
 */
export const UsageCounter: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [bump, setBump] = useState(false);

  // Subscribe to real-time updates when the component mounts
  useEffect(() => {
    const unsub = subscribeToUsageStats((s) => {
      setStats((prev) => {
        // Trigger visual "bump" animation if the count increased
        if (prev !== null && s.totalSessions !== prev.totalSessions) {
          setBump(true);
          setTimeout(() => setBump(false), 500);
        }
        return s;
      });
    });

    // Clean up real-time listener when component unmounts
    return () => unsub();
  }, []);

  // Don't render until first Firestore snapshot is received
  if (stats === null) return null;

  const count = stats.totalSessions;
  const pct = Math.min((count / DAILY_LIMIT) * 100, 100);

  // Dynamic status color based on percentage of daily quota consumed
  const barColor =
    pct >= 90 ? 'var(--danger)' :
    pct >= 65 ? 'var(--warning)' :
    'var(--gdg-blue)';

  return (
    <div id="usage-counter" className="usage-counter" title={`${count} of ${DAILY_LIMIT} daily requests used`}>
      {/* Animated counter number with scale bump */}
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

      {/* Visual capacity progress bar */}
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

