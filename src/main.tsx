/**
 * ============================================================================
 * APPLICATION ENTRY POINT (main.tsx)
 * ============================================================================
 * 
 * Mounts the React application tree into the HTML root DOM node.
 * StrictMode is enabled to catch potential side-effects and lifecycle bugs
 * during development.
 * ============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

