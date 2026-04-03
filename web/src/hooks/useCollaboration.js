import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';

const COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399', 
  '#60A5FA', '#818CF8', '#A78BFA', '#F472B6'
];

export function useCollaboration(formId) {
  const admin = useAuthStore((s) => s.admin);
  const [collaborators, setCollaborators] = useState({});
  const channelRef = useRef(null);
  const myColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const broadcastCursor = useCallback((x, y) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: { x, y, user_id: admin?.id }
      });
    }
  }, [admin?.id]);

  const broadcastSync = useCallback((update) => {
    const ch = channelRef.current;
    if (ch && ch.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'yjs_update',
        payload: { update: Array.from(update), user_id: admin?.id }
      });
    }
  }, [admin?.id]);

  useEffect(() => {
    if (!formId || !admin) return;

    const channelName = `form-collab:${formId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: admin.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const formatted = {};
        Object.keys(state).forEach((key) => {
          formatted[key] = state[key][0];
        });
        setCollaborators((prev) => ({ ...prev, ...formatted }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setCollaborators((prev) => ({
          ...prev,
          [key]: newPresences[0],
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCollaborators((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        setCollaborators((prev) => {
          if (!prev[payload.user_id]) return prev;
          return {
            ...prev,
            [payload.user_id]: {
              ...prev[payload.user_id],
              cursor: { x: payload.x, y: payload.y },
            },
          };
        });
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: admin.id,
          username: admin.username || 'Anonymous',
          color: myColor.current,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [formId, admin]);

  return {
    collaborators,
    broadcastCursor,
    broadcastSync,
    channel: channelRef.current
  };
}
