import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { formatChatListTime } from '../../utils/formatters.js';
import {
  MessageSquare,
  CircleDot,
  Phone,
  Settings,
  Plus,
  Search,
  Pin,
  VolumeX,
  Users,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  LogOut
} from 'lucide-react';

export function Sidebar({
  conversations,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  activeTab,
  onTabChange
}) {
  const { currentUser, fbUser, logout } = useAuth();
  const { onlineUsers, typingUsers } = useSocket();
  const [searchFilter, setSearchFilter] = useState('');

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return conversations;
    const q = searchFilter.toLowerCase();
    return conversations.filter(c => {
      const name = c.type === 'group' ? c.name : (c.otherParticipant?.name || '');
      const lastText = c.lastMessage?.text || '';
      return name.toLowerCase().includes(q) || lastText.toLowerCase().includes(q);
    });
  }, [conversations, searchFilter]);

  // Helper to render last message preview
  const renderLastMessagePreview = (conv) => {
    const isTyping = typingUsers[conv.id] && typingUsers[conv.id].size > 0;
    if (isTyping) {
      return (
        <span className="text-emerald-500 dark:text-emerald-400 font-semibold animate-pulse">
          typing...
        </span>
      );
    }

    const msg = conv.lastMessage;
    if (!msg) return <span className="italic opacity-60">No messages yet</span>;

    const isMine = msg.senderId === currentUser.id;

    let icon = null;
    let text = msg.text;

    if (msg.type === 'image') {
      icon = <ImageIcon className="w-3.5 h-3.5 mr-1 inline shrink-0" />;
      text = 'Photo';
    } else if (msg.type === 'video') {
      icon = <Video className="w-3.5 h-3.5 mr-1 inline shrink-0" />;
      text = 'Video';
    } else if (msg.type === 'audio') {
      icon = <Mic className="w-3.5 h-3.5 mr-1 inline shrink-0" />;
      text = 'Voice message';
    } else if (msg.type === 'document') {
      icon = <FileText className="w-3.5 h-3.5 mr-1 inline shrink-0" />;
      text = msg.fileName || 'Document';
    }

    return (
      <span className="flex items-center truncate">
        {isMine && (
          <span className="inline-flex mr-1 shrink-0">
            {msg.status === 'sent' && <Check className="w-3 h-3 text-slate-400" />}
            {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-slate-400" />}
            {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-cyan-500 font-bold" />}
          </span>
        )}
        {icon}
        <span className="truncate">{text}</span>
      </span>
    );
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shrink-0 select-none">
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenProfile}
            className="cursor-pointer group relative"
            title="View & Edit Profile"
          >
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              size="md"
              online={true}
              showStatus={true}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ChatX
            </span>
            {fbUser && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold border border-emerald-500/25" title="Google Account Active">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google
              </span>
            )}
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenNewGroup}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Create New Group"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-transform active:scale-95"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
            title="Switch Account / Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center justify-around px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 text-xs">
        <button
          type="button"
          onClick={() => onTabChange('chats')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
            activeTab === 'chats'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chats</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('status')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
            activeTab === 'status'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CircleDot className="w-4 h-4" />
          <span>Status</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('calls')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
            activeTab === 'calls'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Calls</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Search Input Filter */}
      {activeTab === 'chats' && (
        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      {activeTab === 'chats' && (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {searchFilter ? 'No conversations matching search' : 'No chats yet. Start a new conversation!'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isGroup = conv.type === 'group';
              const name = isGroup ? conv.name : (conv.otherParticipant?.name || 'User');
              const avatar = isGroup ? conv.avatar : conv.otherParticipant?.avatar;
              const isOnline = isGroup ? false : (onlineUsers.has(conv.otherParticipant?.id) || conv.otherParticipant?.online);
              const isSelected = activeChatId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectChat(conv)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800/90'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Avatar
                    src={avatar}
                    name={name}
                    size="md"
                    online={isOnline}
                    showStatus={!isGroup}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {name}
                        </span>
                        {conv.isPinned && (
                          <Pin className="w-3 h-3 text-emerald-500 fill-current shrink-0" />
                        )}
                        {conv.isMuted && (
                          <VolumeX className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">
                        {conv.lastMessage ? formatChatListTime(conv.lastMessage.createdAt) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="truncate pr-2 min-w-0">
                        {renderLastMessagePreview(conv)}
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}
