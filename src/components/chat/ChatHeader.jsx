import React from 'react';
import { ArrowLeft, Phone, Video, Search, MoreVertical, Shield } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { formatLastSeen } from '../../utils/formatters.js';

export function ChatHeader({
  conversation,
  currentUserId,
  isTyping,
  typingUserName,
  onBack,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenInfo,
  onToggleSearch
}) {
  if (!conversation) return null;

  const isGroup = conversation.type === 'group';
  const otherUser = conversation.otherParticipant;

  const isOnline = isGroup ? false : otherUser?.online;
  const lastSeen = isGroup ? null : otherUser?.lastSeen;

  const headerTitle = isGroup ? conversation.name : (otherUser?.name || 'User');
  const headerAvatar = isGroup ? conversation.avatar : otherUser?.avatar;

  const getSubtext = () => {
    if (isTyping) {
      return (
        <span className="text-emerald-500 dark:text-emerald-400 font-semibold animate-pulse">
          {typingUserName || 'typing'}...
        </span>
      );
    }
    if (isGroup) {
      return `${conversation.participants?.length || 0} members`;
    }
    return formatLastSeen(isOnline, lastSeen);
  };

  return (
    <div className="h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* User / Group Avatar Clickable for Details */}
        <div
          onClick={onOpenInfo}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <Avatar
            src={headerAvatar}
            name={headerTitle}
            size="md"
            online={isOnline}
            showStatus={!isGroup}
          />

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {headerTitle}
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              {getSubtext()}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Voice Call, Video Call, Search, Info */}
      <div className="flex items-center gap-1 sm:gap-2">
        {!isGroup && (
          <>
            <button
              type="button"
              onClick={onStartVoiceCall}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Start voice call"
            >
              <Phone className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onStartVideoCall}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Start video call"
            >
              <Video className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onToggleSearch}
          className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Search in conversation"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenInfo}
          className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Conversation info"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
