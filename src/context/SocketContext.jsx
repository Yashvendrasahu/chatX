import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { playSendSound, playReceiveSound } from '../utils/soundEffects.js';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { currentUser } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> Set of userIds
  const listenersRef = useRef(new Map());

  // Register an event listener
  const on = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);

    return () => {
      const set = listenersRef.current.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }, []);

  // Emit event to server
  const emit = useCallback((payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    let ws;
    let reconnectTimeout;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Internal handlers
            if (data.type === 'presence:update') {
              setOnlineUsers(prev => {
                const next = new Set(prev);
                if (data.online) next.add(data.userId);
                else next.delete(data.userId);
                return next;
              });
            } else if (data.type === 'typing:update') {
              setTypingUsers(prev => {
                const currentSet = new Set(prev[data.conversationId] || []);
                if (data.isTyping) {
                  currentSet.add(data.userId);
                } else {
                  currentSet.delete(data.userId);
                }
                return { ...prev, [data.conversationId]: currentSet };
              });
            } else if (data.type === 'message:new') {
              if (data.message.senderId !== currentUser.id) {
                playReceiveSound();
              }
            }

            // Dispatch to registered listeners
            const callbacks = listenersRef.current.get(data.type);
            if (callbacks) {
              callbacks.forEach(cb => cb(data));
            }
          } catch (err) {
            console.error('Socket message parse error:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [currentUser?.id]);

  const sendTyping = useCallback((conversationId, isTyping) => {
    emit({
      type: 'typing',
      conversationId,
      isTyping
    });
  }, [emit]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        typingUsers,
        on,
        emit,
        sendTyping
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
