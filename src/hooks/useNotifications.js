import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';
import { useUser } from '../context/UserContext';

// ─── Helper ──────────────────────────────────────────────────────────────────
const extractList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) {
    return Array.isArray(data.data) ? data.data : [];
  }
  return [];
};

// ─── Time-ago formatter ───────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'recently';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Future dates or very recent (handle clock skew)
  if (diffInSeconds < 30) return 'just now';
  if (diffInSeconds < 60) return 'just now';
  
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// ─── Type config ─────────────────────────────────────────────────────────────
export const TYPE_CONFIG = {
  // --- Learning ---
  ENROLLMENT:       { color: '#22c55e', icon: '📚', label: 'Enrolled' },
  NEW_ENROLLMENT:   { color: '#10b981', icon: '👤', label: 'New Student' },
  LESSON_COMPLETE:  { color: '#6366f1', icon: '✅', label: 'Lesson Done' },
  COURSE_COMPLETE:  { color: '#a855f7', icon: '🎓', label: 'Course Done' },
  CERTIFICATE:      { color: '#f59e0b', icon: '🏆', label: 'Certificate' },
  QUIZ_RESULT:      { color: '#8b5cf6', icon: '📝', label: 'Quiz Scored' },

  // --- Financial ---
  PAYMENT:              { color: '#3b82f6', icon: '💳', label: 'Payment' },
  PAYMENT_SUBSCRIPTION: { color: '#8b5cf6', icon: '💎', label: 'Subscription' },
  PAYMENT_REFUND:       { color: '#f43f5e', icon: '↩️', label: 'Refunded' },

  // --- Instructor ---
  COURSE_PUBLISHED: { color: '#06b6d4', icon: '🚀', label: 'Published' },
  COURSE_CREATED:   { color: '#14b8a6', icon: '✏️', label: 'Created' },

  // --- Security & Auth ---
  AUTH_REGISTER:        { color: '#10b981', icon: '👋', label: 'Welcome' },
  AUTH_LOGIN:           { color: '#6366f1', icon: '🛡️', label: 'Security' },
  AUTH_STATUS_CHANGE:   { color: '#f59e0b', icon: '⚖️', label: 'Account' },
  AUTH_FORGOT_PASSWORD: { color: '#ec4899', icon: '🔑', label: 'Pass-Reset' },

  // --- Community & Support ---
  DISCUSSION_EVENT: { color: '#f97316', icon: '💬', label: 'Discussion' },
  BUG_REPORT_CONFIRMATION: { color: '#10b981', icon: '🎫', label: 'Bug Ticket' },
  BUG_REPORT_UPDATE:{ color: '#ef4444', icon: '🛠️', label: 'Bug Update' },
  ADMIN_ALERT:      { color: '#f43f5e', icon: '🚨', label: 'Admin Alert' },
  ADMIN_ACTION:     { color: '#ef4444', icon: '🔔', label: 'Admin' },
};

export const getTypeConfig = (type) =>
  TYPE_CONFIG[type?.toUpperCase()] ?? { color: '#94a3b8', icon: '🔔', label: 'Info' };

// ─── Route resolver ───────────────────────────────────────────────────────────
const resolveRoute = (notification) => {
  const { relatedEntityType, relatedEntityId, type } = notification;
  if (!relatedEntityType) return null;
  switch (relatedEntityType.toUpperCase()) {
    case 'COURSE':
      return type === 'CERTIFICATE' ? '/student/progress' : `/course/${relatedEntityId}`;
    case 'LESSON':
      return null;
    default:
      return null;
  }
};

// ─── The Hook ─────────────────────────────────────────────────────────────────
export default function useNotifications() {
  const { user } = useUser();
  const userId = user?.userId || user?.id;

  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);
  const isMounted            = useRef(true);
  const stompClient          = useRef(null);

  const queryClient = useQueryClient();

  // ✅ useMemo — stable array reference, safe to use in dependency arrays
  // Without this, ESLint warns about missing QUERY_KEY in useCallback deps.
  // And if we defined it as a plain array, it would be a new reference every
  // render which would break useCallback stability.
  const QUERY_KEY = useMemo(() => ['userNotifications', userId], [userId]);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const { data: notifications = [], refetch, isFetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!userId) return [];
      const res = await notificationService.getUserNotifications();
      const list = extractList(res).filter((notification) =>
        Number(notification?.userId) === Number(userId)
      );
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list;
    },
    enabled: !!userId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Derived: unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Mark one as read ──────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      queryClient.setQueryData(QUERY_KEY, (prev = []) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useNotifications] markAsRead error:', err);
    }
  }, [queryClient, QUERY_KEY]);

  // ── Mark all as read ──────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationService.markAllAsRead();
      queryClient.setQueryData(QUERY_KEY, (prev = []) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useNotifications] markAllAsRead error:', err);
    }
  }, [queryClient, userId, QUERY_KEY]);

  // ── Clear all notifications ───────────────────────────────────────────
  const clearAll = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationService.deleteAllNotifications();
      queryClient.setQueryData(QUERY_KEY, []);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useNotifications] clearAll error:', err);
    }
  }, [queryClient, userId, QUERY_KEY]);

  // ── Delete one notification ───────────────────────────────────────────
  const deleteOne = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      queryClient.setQueryData(QUERY_KEY, (prev = []) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useNotifications] deleteOne error:', err);
    }
  }, [queryClient, QUERY_KEY]);

  // ── Toast helpers ─────────────────────────────────────────────────────
  const pushToast = useCallback((notification) => {
    if (import.meta.env.DEV) console.log('[Notifications] Pushing toast:', notification.title);
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ id, notification }, ...prev]);
    setTimeout(() => {
      if (isMounted.current) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }
    }, 5000);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // ── WebSocket ─────────────────────────────────────────────────────────
  const connectWS = useCallback(async () => {
    if (!userId || stompClient.current?.connected) return;

    try {
      // Dynamic imports to keep these out of the initial bundle
      const [{ Client }, { default: SockJS }] = await Promise.all([
        import('@stomp/stompjs'),
        import('sockjs-client')
      ]);

      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8000/ws-notifications'),
        connectHeaders: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          if (import.meta.env.DEV) console.log('[WS] Connected');
          if (isMounted.current) setConnected(true);
          client.subscribe(`/topic/notifications/${userId}`, (message) => {
            if (!isMounted.current) return;
            try {
              const notification = JSON.parse(message.body);
              if (Number(notification?.userId) !== Number(userId)) {
                return;
              }

              queryClient.setQueryData(QUERY_KEY, (prev = []) => {
                const exists = prev.some(
                  (n) => n.notificationId === notification.notificationId
                );
                if (exists) return prev;
                return [notification, ...prev];
              });
              pushToast(notification);
            } catch (e) {
              if (import.meta.env.DEV) console.error('[WS] Parse error:', e);
            }
          });
        },
        onStompError: (frame) => {
          if (import.meta.env.DEV) console.error('[WS] STOMP error:', frame);
          if (isMounted.current) setConnected(false);
        },
        onWebSocketClose: () => {
          if (import.meta.env.DEV) console.warn('[WS] WebSocket closed');
          if (isMounted.current) setConnected(false);
        },
        onDisconnect: () => {
          if (import.meta.env.DEV) console.log('[WS] Disconnected');
          if (isMounted.current) setConnected(false);
        },
      });

      client.activate();
      stompClient.current = client;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[WS] Failed to load socket libraries:', err);
    }
  }, [userId, pushToast, queryClient, QUERY_KEY]);

  // ── Mount / unmount ───────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    // Defer WebSocket until browser is idle (after dashboard paints).
    // requestIdleCallback fires only when the main thread is free.
    // Fallback: plain setTimeout(3000) for browsers without rIC support.
    let idleHandle;
    const initWS = () => {
      if (userId && isMounted.current) connectWS();
    };

    if (typeof requestIdleCallback !== 'undefined') {
      idleHandle = requestIdleCallback(initWS, { timeout: 3000 });
    } else {
      idleHandle = setTimeout(initWS, 2000);
    }

    return () => {
      isMounted.current = false;
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(idleHandle);
      } else {
        clearTimeout(idleHandle);
      }
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
    };
  }, [userId, connectWS]);

  return {
    notifications,
    unreadCount,
    toasts,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteOne,
    dismissToast,
    refetch,
    isFetching,
    connected,
    resolveRoute,
  };
}
