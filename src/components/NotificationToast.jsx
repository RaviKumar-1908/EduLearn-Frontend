import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotificationContext } from '../context/NotificationContext';
import { getTypeConfig } from '../hooks/useNotifications';

// ─── Single Toast Card ───────────────────────────────────────────────────────
function ToastCard({ id, notification, onDismiss }) {
  const cfg = getTypeConfig(notification.type);

  return (
    <div
      key={id}
      className="animate-slide-up"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        padding: '1rem 1.1rem',
        borderRadius: '1.2rem',
        background: 'rgba(var(--bg-secondary-rgb, 17, 24, 39), 0.95)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${cfg.color}40`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px ${cfg.color}18`,
        width: '340px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto'
      }}
    >
      {/* Coloured left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '5px',
          background: cfg.color,
          borderRadius: '1.2rem 0 0 1.2rem',
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '0.9rem',
          background: `${cfg.color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.35rem',
          flexShrink: 0,
          boxShadow: `inset 0 0 12px ${cfg.color}15`
        }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: '0.1rem' }}>
        <p
          style={{
            margin: 0,
            fontWeight: 900,
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em'
          }}
        >
          {notification.title}
        </p>
        <p
          style={{
            margin: '0.2rem 0 0',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            opacity: 0.8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.45,
            fontWeight: 500
          }}
        >
          {notification.message}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <span
            style={{
                display: 'inline-block',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: cfg.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: `${cfg.color}12`,
                padding: '0.15rem 0.4rem',
                borderRadius: '0.4rem'
            }}
            >
            {cfg.label}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.4, fontWeight: 700 }}>• SYSTEM ALERT</span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(id)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          color: 'var(--text-secondary)',
          opacity: 0.6,
          cursor: 'pointer',
          padding: '0.35rem',
          borderRadius: '0.6rem',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
          marginTop: '-0.2rem'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={3} />
      </button>

      {/* Progress bar */}
      <div
        className="toast-progress"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
          transformOrigin: 'left',
          opacity: 0.8,
          animation: 'toast-progress-shrink 5s linear forwards'
        }}
      />
    </div>
  );
}

// ─── Toast Container (fixed, bottom-right) ───────────────────────────────────
export default function NotificationToast() {
  const { toasts, dismissToast } = useNotificationContext();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      id="system-notification-container"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(({ id, notification }) => (
        <ToastCard 
            key={id} 
            id={id} 
            notification={notification} 
            onDismiss={dismissToast} 
        />
      ))}
    </div>
  );
}
