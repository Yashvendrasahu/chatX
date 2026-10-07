import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider, useSocket } from './context/SocketContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CallProvider, useCall } from './context/CallContext.jsx';

import { AuthScreen } from './components/auth/AuthScreen.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { ChatWindow } from './components/chat/ChatWindow.jsx';
import { EmptyChat } from './components/chat/EmptyChat.jsx';
import { StatusView } from './components/status/StatusView.jsx';
import { CallsView } from './components/calls/CallsView.jsx';
import { SettingsView } from './components/settings/SettingsView.jsx';

import { NewChatModal } from './components/modals/NewChatModal.jsx';
import { NewGroupModal } from './components/modals/NewGroupModal.jsx';
import { GroupInfoModal } from './components/modals/GroupInfoModal.jsx';
import { ProfileModal } from './components/modals/ProfileModal.jsx';
import { CallModal } from './components/calls/CallModal.jsx';
import { db, auth, OperationType, handleFirestoreError } from './firebase.js';
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

function MainChatLayout() {
  const { currentUser, availableUsers, fbUser } = useAuth();
  const { on } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'status' | 'calls' | 'settings'

  // Modals state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch all conversations from backend
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchConversations();
    // Fast periodic sync (every 3s) for seamless multi-device testing
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [fetchConversations]);

  // Real-time Firestore chat history sync
  useEffect(() => {
    if (!auth.currentUser || !fbUser || !currentUser?.id) return;

    const path = 'conversations';
    const q = query(
      collection(db, path),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreConvs = [];
        snapshot.forEach((docSnap) => {
          firestoreConvs.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (firestoreConvs.length > 0) {
          const enriched = firestoreConvs.map((conv) => {
            const participantDetails = (conv.participants || []).map((pid) => {
              if (pid === currentUser.id) return currentUser;
              return (
                availableUsers.find((u) => u.id === pid) || {
                  id: pid,
                  name: 'Contact',
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}&backgroundColor=b6e3f4`
                }
              );
            });
            const otherParticipant =
              conv.type === 'direct'
                ? participantDetails.find((p) => p.id !== currentUser.id) || participantDetails[0]
                : null;

            return {
              ...conv,
              participantDetails,
              otherParticipant,
              isPinned: conv.pinnedBy?.includes(currentUser.id),
              isMuted: conv.mutedBy?.includes(currentUser.id)
            };
          });

          setConversations((prev) => {
            const map = new Map();
            enriched.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values()).sort((a, b) => {
              const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
              const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              return timeB - timeA;
            });
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [currentUser, availableUsers, fbUser]);

  // Socket event listeners for real-time conversation updates
  useEffect(() => {
    const unsubNewConv = on('conversation:new', (data) => {
      fetchConversations();
    });

    const unsubUpdateConv = on('conversation:update', (data) => {
      fetchConversations();
    });

    const unsubNewMsg = on('message:new', (data) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === data.conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }
        return prev.map(c => {
          if (c.id === data.conversationId) {
            const isFromOther = data.message.senderId !== currentUser.id;
            const isCurrentlyActive = activeChatId === data.conversationId;
            return {
              ...c,
              lastMessage: data.message,
              unreadCount: isFromOther && !isCurrentlyActive ? (c.unreadCount || 0) + 1 : c.unreadCount,
              updatedAt: data.message.createdAt
            };
          }
          return c;
        }).sort((a, b) => {
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return timeB - timeA;
        });
      });
    });

    const unsubRead = on('message:read', (data) => {
      if (data.readByUserId === currentUser.id) {
        setConversations(prev =>
          prev.map(c => {
            if (c.id === data.conversationId) {
              return { ...c, unreadCount: 0 };
            }
            return c;
          })
        );
      }
    });

    return () => {
      unsubNewConv();
      unsubUpdateConv();
      unsubNewMsg();
      unsubRead();
    };
  }, [activeChatId, currentUser.id, fetchConversations, on]);

  // Active selected conversation object
  const activeConversation = conversations.find(c => c.id === activeChatId);

  // Start new 1-to-1 conversation
  const handleSelectUserToChat = async (targetUser) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          type: 'direct',
          recipientId: targetUser.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (auth.currentUser && fbUser && data.conversation) {
          try {
            await setDoc(doc(db, 'conversations', data.conversation.id), {
              ...data.conversation,
              updatedAt: data.conversation.updatedAt || new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.warn('Firestore conversation sync note:', err);
          }
        }
        await fetchConversations();
        setActiveChatId(data.conversation.id);
        setActiveTab('chats');
      }
    } catch (err) {
      console.error('Failed to create 1-to-1 conversation:', err);
    }
  };

  // Create new group
  const handleCreateGroup = async (groupPayload) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          type: 'group',
          ...groupPayload
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (auth.currentUser && fbUser && data.conversation) {
          try {
            await setDoc(doc(db, 'conversations', data.conversation.id), {
              ...data.conversation,
              updatedAt: data.conversation.updatedAt || new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.warn('Firestore group sync note:', err);
          }
        }
        await fetchConversations();
        setActiveChatId(data.conversation.id);
        setActiveTab('chats');
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  // Update conversation (pin, mute, add/remove member)
  const handleUpdateConversation = async (convId, updatePayload) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify(updatePayload)
      });
      if (res.ok) {
        await fetchConversations();
      }
    } catch (err) {
      console.error('Failed to update conversation:', err);
    }
  };

  // Leave / Delete conversation
  const handleLeaveOrDelete = async (conv) => {
    if (conv.type === 'group') {
      await handleUpdateConversation(conv.id, {
        action: 'remove-member',
        memberId: currentUser.id
      });
    }
    setActiveChatId(null);
    await fetchConversations();
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar (Desktop always visible, Mobile hidden when chat active) */}
      <div className={`h-full ${activeChatId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <Sidebar
          conversations={conversations}
          activeChatId={activeChatId}
          onSelectChat={(conv) => {
            setActiveChatId(conv.id);
            setActiveTab('chats');
          }}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenNewGroup={() => setShowNewGroupModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'chats') setActiveChatId(null);
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 h-full ${!activeChatId && activeTab === 'chats' ? 'hidden md:flex' : 'flex'}`}>
        {activeTab === 'chats' ? (
          activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={() => setActiveChatId(null)}
              onOpenInfo={() => setShowGroupInfoModal(true)}
              onForwardMessage={(msg) => setShowNewChatModal(true)}
            />
          ) : (
            <EmptyChat onStartNewChat={() => setShowNewChatModal(true)} />
          )
        ) : activeTab === 'status' ? (
          <StatusView />
        ) : activeTab === 'calls' ? (
          <CallsView />
        ) : activeTab === 'settings' ? (
          <SettingsView onOpenProfile={() => setShowProfileModal(true)} />
        ) : null}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleSelectUserToChat}
      />

      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      <GroupInfoModal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        conversation={activeConversation}
        onUpdateConversation={handleUpdateConversation}
        onLeaveOrDelete={handleLeaveOrDelete}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <CallModal />
    </div>
  );
}

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <SocketProvider>
      <CallProvider>
        <MainChatLayout />
      </CallProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
