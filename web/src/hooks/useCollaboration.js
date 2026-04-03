import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399', 
  '#60A5FA', '#818CF8', '#A78BFA', '#F472B6'
];

export function useCollaboration(formId) {
  const admin = useAuthStore((s) => s.admin);
  const [collaborators, setCollaborators] = useState({});
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastCursorSentAtRef = useRef(0);
  const remoteYjsHandlerRef = useRef(null);
  const schemaSnapshotHandlerRef = useRef(null);
  const closedByClientRef = useRef(false);

  const pickColorForUser = useCallback((userId) => {
    if (!userId) return COLORS[0];
    const hash = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return COLORS[Math.abs(hash) % COLORS.length];
  }, []);

  const sendMessage = useCallback((payload) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }, []);

  const broadcastCursor = useCallback((x, y) => {
    if (!admin?.id) return;
    const now = Date.now();
    if (now - lastCursorSentAtRef.current < 40) return;
    lastCursorSentAtRef.current = now;
    sendMessage({ type: 'cursor_move', x, y });
  }, [admin?.id, sendMessage]);

  const broadcastSync = useCallback((update) => {
    if (!admin?.id || !update) return;
    sendMessage({ type: 'yjs_update', update: Array.from(update) });
  }, [admin?.id, sendMessage]);

  const broadcastSchema = useCallback((schema) => {
    if (!admin?.id || !schema || typeof schema !== 'object') return;
    sendMessage({ type: 'schema_update', schema });
  }, [admin?.id, sendMessage]);

  const onRemoteYjsUpdate = useCallback((callback) => {
    remoteYjsHandlerRef.current = callback;
    return () => {
      if (remoteYjsHandlerRef.current === callback) {
        remoteYjsHandlerRef.current = null;
      }
    };
  }, []);

  const onSchemaSnapshot = useCallback((callback) => {
    schemaSnapshotHandlerRef.current = callback;
    return () => {
      if (schemaSnapshotHandlerRef.current === callback) {
        schemaSnapshotHandlerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('zealflow_token');
    if (!formId || formId === 'new' || !admin?.id || !token) return () => {};

    closedByClientRef.current = false;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBase = (import.meta.env.VITE_WS_URL || apiUrl)
      .replace(/^http:\/\//i, 'ws://')
      .replace(/^https:\/\//i, 'wss://')
      .replace(/\/$/, '');

    const connectSocket = () => {
      if (closedByClientRef.current) return;

      const wsUrl = `${wsBase}/ws/forms/${encodeURIComponent(formId)}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        sendMessage({ type: 'ping' });
      };

      socket.onmessage = (event) => {
        let data = null;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data?.type === 'presence_snapshot' && Array.isArray(data.users)) {
          setCollaborators((prev) => {
            const next = {};
            data.users.forEach((user) => {
              if (!user?.user_id) return;
              next[user.user_id] = {
                ...(prev[user.user_id] || {}),
                user_id: user.user_id,
                username: user.username,
                color: pickColorForUser(user.user_id),
              };
            });
            return next;
          });
          return;
        }

        if (data?.type === 'cursor_move' && data.user_id) {
          setCollaborators((prev) => {
            const current = prev[data.user_id];
            if (!current) return prev;
            return {
              ...prev,
              [data.user_id]: {
                ...current,
                cursor: { x: data.x, y: data.y },
              },
            };
          });
          return;
        }

        if (data?.type === 'yjs_update' && data.user_id !== admin.id && Array.isArray(data.update)) {
          if (typeof remoteYjsHandlerRef.current === 'function') {
            remoteYjsHandlerRef.current(data.update);
          }
          return;
        }

        if (data?.type === 'schema_snapshot' && data.schema && typeof data.schema === 'object') {
          if (typeof schemaSnapshotHandlerRef.current === 'function') {
            schemaSnapshotHandlerRef.current(data.schema);
          }
          return;
        }

        if (data?.type === 'schema_update' && data.user_id !== admin.id && data.schema && typeof data.schema === 'object') {
          if (typeof schemaSnapshotHandlerRef.current === 'function') {
            schemaSnapshotHandlerRef.current(data.schema);
          }
        }
      };

      socket.onclose = () => {
        if (closedByClientRef.current || !formId || formId === 'new') return;
        const attempt = reconnectAttemptsRef.current;
        const delay = Math.min(5000, 400 * 2 ** attempt);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connectSocket, delay);
      };
    };

    connectSocket();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      closedByClientRef.current = true;
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) socket.close();
      setCollaborators({});
    };
  }, [formId, admin?.id, sendMessage, pickColorForUser]);

  return {
    collaborators,
    broadcastCursor,
    broadcastSync,
    broadcastSchema,
    onRemoteYjsUpdate,
    onSchemaSnapshot,
  };
}
