import React, { createContext, useContext } from 'react';
import useNotifications from '../hooks/useNotifications';

// ─── Context ─────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

// ─── Inner Logic Component ───────────────────────────────────────────────────
// We separate the logic to ensure the Provider itself mounts instantly 
// and doesn't block the main thread with heavy WebSocket/Query initialization.
function NotificationLogic({ children }) {
  const value = useNotifications();
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Provider — wraps the app, creates ONE WebSocket connection ───────────────
export function NotificationProvider({ children }) {
  return <NotificationLogic>{children}</NotificationLogic>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationContext must be used inside <NotificationProvider>');
  }
  return ctx;
}
