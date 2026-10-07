import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatHeader } from './ChatHeader.jsx';
import { MessageItem } from './MessageItem.jsx';
import { MessageComposer } from './MessageComposer.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { db, auth, OperationType, handleFirestoreError } from '../../firebase.js';
import { doc, setDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Lock, ArrowDown, Search, X } from 'lucide-react';

export function ChatWindow({
  conversation,
  onBack,
  onOpenInfo,
  onForwardMessage
}) {
  const { currentUser, fbUser } = useAuth();
  const { on, sendTyping, typingUsers } = useSocket();
  const { startCall } = useCall();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Check if someone in this chat is typing
  const convTypers = typingUsers[conversation.id] || new Set();
  const isTyping = convTypers.size > 0;
  const typingUserObj = isTyping
    ? conversation.participantDetails?.find(p => convTypers.has(p.id))
    : null;

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!conversation?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        // Mark messages as read
        fetch(`/api/conversations/${conversation.id}/messages/read`, {
          method: 'POST',
          headers: { 'x-user-id': currentUser.id }
        });
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id, currentUser.id]);

  useEffect(() => {
    fetchMessages();
    setReplyingTo(null);
    setEditingMessage(null);
    setShowSearch(false);
    setSearchQuery('');

    // High-frequency periodic polling (every 2.5s) for instant sync across devices
    const pollInterval = setInterval(() => {
      fetch(`/api/conversations/${conversation.id}/messages`, {
        headers: { 'x-user-id': currentUser.id }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.messages)) {
            setMessages(prev => {
              const prevIds = new Set(prev.map(m => m.id));
              const hasNew = data.messages.some(m => !prevIds.has(m.id));
              const statusChanged = data.messages.some(m => {
                const existing = prev.find(p => p.id === m.id);
                return existing && existing.status !== m.status;
              });

              if (hasNew || statusChanged || data.messages.length !== prev.length) {
                const map = new Map();
                prev.forEach(m => map.set(m.id, m));
                data.messages.forEach(m => map.set(m.id, m));
                return Array.from(map.values()).sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [conversation.id, currentUser.id, fetchMessages]);

  // Real-time Firestore messages sync for active conversation
  useEffect(() => {
    if (!conversation?.id || !auth.currentUser || !fbUser) return;

    const path = `conversations/${conversation.id}/messages`;
    const q = query(
      collection(db, 'conversations', conversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreMsgs = [];
        snapshot.forEach((docSnap) => {
          firestoreMsgs.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (firestoreMsgs.length > 0) {
          setMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => map.set(m.id, m));
            firestoreMsgs.forEach((m) => map.set(m.id, m));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
          setLoading(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [conversation.id, fbUser]);

  // Real-time socket message listeners
  useEffect(() => {
    const unsubNewMsg = on('message:new', (data) => {
      if (data.conversationId === conversation.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        // If from someone else, mark as read
        if (data.message.senderId !== currentUser.id) {
          fetch(`/api/conversations/${conversation.id}/messages/read`, {
            method: 'POST',
            headers: { 'x-user-id': currentUser.id }
          });
        }
      }
    });

    const unsubUpdateMsg = on('message:update', (data) => {
      if (data.conversationId === conversation.id) {
        setMessages(prev => prev.map(m => (m.id === data.message.id ? data.message : m)));
      }
    });

    const unsubDeleteForMe = on('message:delete_for_me', (data) => {
      if (data.conversationId === conversation.id) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    const unsubRead = on('message:read', (data) => {
      if (data.conversationId === conversation.id) {
        setMessages(prev =>
          prev.map(m => {
            if (m.senderId === currentUser.id && m.status !== 'read') {
              return { ...m, status: 'read' };
            }
            return m;
          })
        );
      }
    });

    return () => {
      unsubNewMsg();
      unsubUpdateMsg();
      unsubDeleteForMe();
      unsubRead();
    };
  }, [conversation.id, currentUser.id, on]);

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollBottom(!isNearBottom);
    }
  };

  // Send new message
  const handleSendMessage = async (msgPayload) => {
    const textContent = (msgPayload.text || '').trim();
    if (!textContent && !msgPayload.mediaUrl && msgPayload.type !== 'audio') return;

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg = {
      id: msgId,
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name || 'User',
      senderAvatar: currentUser.avatar || null,
      type: msgPayload.type || 'text',
      text: textContent,
      mediaUrl: msgPayload.mediaUrl || null,
      fileName: msgPayload.fileName || null,
      fileSize: msgPayload.fileSize || null,
      fileType: msgPayload.fileType || null,
      duration: msgPayload.duration || null,
      replyTo: replyingTo || null,
      status: 'sent',
      readBy: [currentUser.id],
      reactions: {},
      createdAt: new Date().toISOString()
    };

    // 1. Optimistic UI update: message immediately appears in the chat
    setMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setReplyingTo(null);

    // 2. Direct Firestore persistence across devices
    if (auth.currentUser && fbUser) {
      try {
        const msgDocRef = doc(db, 'conversations', conversation.id, 'messages', msgId);
        await setDoc(msgDocRef, newMsg, { merge: true });

        const convDocRef = doc(db, 'conversations', conversation.id);
        await setDoc(convDocRef, {
          id: conversation.id,
          participants: conversation.participants || [currentUser.id],
          lastMessage: newMsg,
          updatedAt: newMsg.createdAt
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore direct write note:', err);
      }
    }

    // 3. Backend REST + WebSocket broadcast
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          ...msgPayload,
          id: msgId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          participants: conversation.participants,
          conversationType: conversation.type,
          createdAt: newMsg.createdAt
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message && data.message.status) {
          setMessages(prev =>
            prev.map(m => m.id === msgId ? { ...m, status: data.message.status } : m)
          );
        }
      }
    } catch (err) {
      console.warn('Backend message notification note:', err);
    }
  };

  // Edit message
  const handleSaveEdit = async (msgId, newText) => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages/${msgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ text: newText })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => (m.id === msgId ? data.message : m)));
        setEditingMessage(null);
      }
    } catch (err) {
      console.error('Edit message error:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msg, deleteForEveryone) => {
    try {
      await fetch(`/api/conversations/${conversation.id}/messages/${msg.id}?deleteForEveryone=${deleteForEveryone}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id }
      });
      if (deleteForEveryone) {
        setMessages(prev =>
          prev.map(m => (m.id === msg.id ? { ...m, isDeleted: true, text: 'This message was deleted', mediaUrl: null } : m))
        );
      } else {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const handleStartVoiceCall = () => {
    if (conversation.otherParticipant) {
      startCall(conversation.otherParticipant, 'audio');
    }
  };

  const handleStartVideoCall = () => {
    if (conversation.otherParticipant) {
      startCall(conversation.otherParticipant, 'video');
    }
  };

  // Filter messages by search
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Top Header */}
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUser.id}
        isTyping={isTyping}
        typingUserName={typingUserObj?.name}
        onBack={onBack}
        onStartVoiceCall={handleStartVoiceCall}
        onStartVideoCall={handleStartVideoCall}
        onOpenInfo={onOpenInfo}
        onToggleSearch={() => setShowSearch(!showSearch)}
      />

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150 z-10">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search in this conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-xs bg-transparent border-0 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Message Feed with Chat Wallpaper */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 chat-pattern-light dark:chat-pattern-dark relative"
      >
        {/* Encryption Notice */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-medium max-w-sm text-center shadow-xs">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Messages are secured with end-to-end encryption.</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4 p-4">
            <div className="w-48 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer-anim" />
            <div className="w-64 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 ml-auto shimmer-anim" />
            <div className="w-56 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shimmer-anim" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {searchQuery ? 'No matching messages found' : 'No messages yet. Send a greeting to begin! 👋'}
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUserId={currentUser.id}
              onReply={(m) => { setReplyingTo(m); setEditingMessage(null); }}
              onEdit={(m) => { setEditingMessage(m); setReplyingTo(null); }}
              onDelete={handleDeleteMessage}
              onForward={onForwardMessage}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Floating Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute right-6 bottom-20 z-20 w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-105"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Bottom Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onTyping={(isTyping) => sendTyping(conversation.id, isTyping)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onSaveEdit={handleSaveEdit}
      />
    </div>
  );
}
