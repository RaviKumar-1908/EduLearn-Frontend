import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotificationContext } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { getTypeConfig, timeAgo } from '../../hooks/useNotifications';

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotifRow({ notif, onRead, onDelete, onNavigate, resolveRoute }) {
  const cfg = getTypeConfig(notif.type);

  const handleClick = (e) => {
    // Prevent navigation if clicking the delete button
    if (e.target.closest('.delete-btn')) return;
    
    if (!notif.isRead) onRead(notif.notificationId);
    const route = resolveRoute ? resolveRoute(notif) : null;
    if (route) onNavigate(route);
  };

  return (
    <div
      onClick={handleClick}
      className="animate-fade-in hover-lift"
      style={{
        display: 'flex',
        gap: '0.9rem',
        padding: '0.9rem 1rem',
        borderRadius: '1.1rem',
        cursor: 'pointer',
        background: notif.isRead ? 'transparent' : `${cfg.color}15`,
        border: notif.isRead ? '1px solid transparent' : `1px solid ${cfg.color}33`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Coloured left strip */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: cfg.color,
          opacity: notif.isRead ? 0.25 : 0.85,
          borderRadius: '1.1rem 0 0 1.1rem',
        }}
      />

      {/* Icon bubble */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '1rem',
          background: `${cfg.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
            <span
            style={{
              fontWeight: notif.isRead ? 600 : 800,
              fontSize: '0.85rem',
              color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notif.title}
          </span>
          {!notif.isRead && (
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: cfg.color,
                boxShadow: `0 0 6px ${cfg.color}`,
                flexShrink: 0,
                marginTop: '4px',
              }}
            />
          )}
        </div>

        <p
          style={{
            margin: '0.2rem 0 0',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            opacity: 0.8,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {notif.message}
        </p>

        <div
          style={{
            marginTop: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: cfg.color,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.8,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.4, fontWeight: 600 }}>
            •
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.6, fontWeight: 600 }}>
            {timeAgo(notif.createdAt)}
          </span>
        </div>
      </div>

      {/* Delete Button */}
      <button
        className="delete-btn hover-scale"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notif.notificationId);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          opacity: 0.3,
          padding: '0.4rem',
          cursor: 'pointer',
          alignSelf: 'center',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Delete notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────
export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { isDarkMode } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, deleteOne, resolveRoute, connected } = useNotificationContext();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Only show when user is logged in
  if (!user?.userId && !user?.id) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell-btn"
        className="hover-scale"
        onClick={() => setIsOpen((o) => !o)}
        style={{
          position: 'relative',
          background: isOpen
            ? 'rgba(99,102,241,0.15)'
            : 'rgba(255,255,255,0.03)',
          border: isOpen
            ? '1px solid rgba(99,102,241,0.35)'
            : '1px solid rgba(255,255,255,0.07)',
          width: '44px',
          height: '44px',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isOpen ? '#a5b4fc' : 'var(--text-primary)',
          transition: 'all 0.25s ease',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <div className={unreadCount > 0 ? 'animate-bell-shake' : ''}>
          <Bell size={20} />
        </div>

        {unreadCount > 0 && (
          <span
            className="animate-scale-in"
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'linear-gradient(135deg, #ef4444, #ec4899)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 900,
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 14px rgba(239,68,68,0.5)',
              border: '2px solid var(--bg-primary)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {/* Dropdown Panel */}
        {isOpen && (
          <div
            id="notification-dropdown"
            className="animate-scale-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 1rem)',
              right: 0,
              width: '380px',
              maxHeight: '560px',
              zIndex: 1200,
              borderRadius: '2rem',
              background: 'var(--card-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-color)',
              boxShadow: isDarkMode ? '0 40px 90px rgba(0,0,0,0.6)' : '0 20px 50px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.4rem 1.4rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  Notifications
                </h4>
                <p
                  style={{
                    margin: '0.15rem 0 0',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>

              {notifications.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {unreadCount > 0 && (
                    <button
                      className="hover-lift"
                      onClick={markAllAsRead}
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        color: 'rgba(165,180,252,0.8)',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        borderRadius: '0.6rem',
                        padding: '0.35rem 0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.2s',
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={12} />
                      Read All
                    </button>
                  )}
                  
                  <button
                    onClick={clearAll}
                    className="hover-lift"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      borderRadius: '0.6rem',
                      padding: '0.35rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'all 0.2s',
                    }}
                    title="Clear all notifications"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Notification List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                // Custom scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99,102,241,0.3) transparent',
              }}
            >
              {notifications.length === 0 ? (
                <div
                  className="animate-fade-in"
                  style={{
                    padding: '3.5rem 2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '1.5rem',
                      background: 'var(--input-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      fontSize: '1.75rem',
                    }}
                  >
                    🔔
                  </div>
                  <h5 style={{ margin: 0, color: 'var(--text-primary)', opacity: 0.7, fontSize: '1rem', fontWeight: 800 }}>
                    No Notifications Yet
                  </h5>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', fontWeight: 500 }}>
                    We'll let you know when something happens.
                  </p>
                </div>
              ) : (
                  notifications.map((notif) => (
                    <NotifRow
                      key={notif.notificationId}
                      notif={notif}
                      onRead={markAsRead}
                      onDelete={deleteOne}
                      resolveRoute={resolveRoute}
                      onNavigate={(route) => {
                        navigate(route);
                        setIsOpen(false);
                      }}
                    />
                  ))
              )}
            </div>

            {/* Footer status bar */}
            <div
              style={{
                padding: '0.75rem 1.4rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: connected ? '#22c55e' : '#ef4444',
                  boxShadow: connected ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {connected ? 'Live — WebSocket Connected' : 'Offline — Reconnecting...'}
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
