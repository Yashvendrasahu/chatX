import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Pin,
  VolumeX,
  Volume2,
  Users,
  ShieldCheck,
  UserPlus,
  UserMinus,
  LogOut,
  Trash2,
  Phone,
  Mail,
  FileText
} from 'lucide-react';

export function GroupInfoModal({
  isOpen,
  onClose,
  conversation,
  onUpdateConversation,
  onLeaveOrDelete
}) {
  const { currentUser, availableUsers } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');

  if (!conversation) return null;

  const isGroup = conversation.type === 'group';
  const otherUser = conversation.otherParticipant;
  const isAdmin = isGroup && conversation.admins?.includes(currentUser.id);

  const title = isGroup ? conversation.name : otherUser?.name;
  const avatar = isGroup ? conversation.avatar : otherUser?.avatar;

  const handleTogglePin = () => {
    onUpdateConversation(conversation.id, { action: 'toggle-pin' });
  };

  const handleToggleMute = () => {
    onUpdateConversation(conversation.id, { action: 'toggle-mute' });
  };

  const handleAddMember = async () => {
    if (!selectedNewMember) return;
    await onUpdateConversation(conversation.id, {
      action: 'add-member',
      memberId: selectedNewMember
    });
    setSelectedNewMember('');
    setShowAddMember(false);
  };

  const handleRemoveMember = async (memberId) => {
    await onUpdateConversation(conversation.id, {
      action: 'remove-member',
      memberId
    });
  };

  const handleToggleAdmin = async (memberId, currentRole) => {
    await onUpdateConversation(conversation.id, {
      action: 'set-admin',
      memberId,
      role: currentRole === 'admin' ? 'member' : 'admin'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isGroup ? 'Group Information' : 'Contact Details'}>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center">
          <Avatar src={avatar} name={title} size="2xl" className="mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {!isGroup && otherUser?.username && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">@{otherUser.username}</p>
          )}
          {isGroup && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Group · {conversation.participants?.length || 0} members
            </p>
          )}
        </div>

        {/* Bio / Description */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            {isGroup ? 'Group Description' : 'About & Phone'}
          </div>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            {isGroup
              ? conversation.description || 'No description provided.'
              : otherUser?.bio || 'Hey there! I am using ChatX.'}
          </p>
          {!isGroup && otherUser?.phone && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" />
              <span>{otherUser.phone}</span>
            </div>
          )}
        </div>

        {/* Quick Action Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleTogglePin}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              conversation.isPinned
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Pin className="w-4 h-4" />
            <span>{conversation.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              conversation.isMuted
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-600 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {conversation.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{conversation.isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>

        {/* Group Participants Section */}
        {isGroup && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Members ({conversation.participantDetails?.length || 0})
              </h4>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add Member Dropdown */}
            {showAddMember && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                <select
                  value={selectedNewMember}
                  onChange={(e) => setSelectedNewMember(e.target.value)}
                  className="flex-1 text-xs py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select contact to add...</option>
                  {availableUsers
                    .filter(u => !conversation.participants.includes(u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!selectedNewMember}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {conversation.participantDetails?.map(member => {
                const memberIsAdmin = conversation.admins?.includes(member.id);
                const isMe = member.id === currentUser.id;

                return (
                  <div key={member.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={member.avatar} name={member.name} size="sm" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {isMe && <span className="text-[10px] text-slate-400">(You)</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">@{member.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {memberIsAdmin && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Admin
                        </span>
                      )}

                      {isAdmin && !isMe && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(member.id, memberIsAdmin ? 'admin' : 'member')}
                            className="p-1 text-slate-400 hover:text-emerald-600 text-[10px]"
                            title={memberIsAdmin ? 'Dismiss as Admin' : 'Make Group Admin'}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 text-[10px]"
                            title="Remove from Group"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onLeaveOrDelete(conversation);
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {isGroup ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            <span>{isGroup ? 'Leave Group' : 'Delete Conversation'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
