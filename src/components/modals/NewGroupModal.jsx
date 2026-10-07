import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, Check, X } from 'lucide-react';

export function NewGroupModal({ isOpen, onClose, onCreateGroup }) {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: { 'x-user-id': currentUser.id }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
    setGroupName('');
    setGroupDesc('');
    setSelectedUserIds([]);
  }, [isOpen, currentUser.id]);

  const toggleUser = (uid) => {
    if (selectedUserIds.includes(uid)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
    } else {
      setSelectedUserIds([...selectedUserIds, uid]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      setLoading(true);
      await onCreateGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        participantIds: selectedUserIds
      });
      onClose();
    } catch (err) {
      console.error('Create group failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Group Subject
          </label>
          <input
            type="text"
            placeholder="e.g. Design Team 🎨"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Group Description (Optional)
          </label>
          <input
            type="text"
            placeholder="What is this group about?"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Selected Members Chips */}
        {selectedUserIds.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Selected Members ({selectedUserIds.length})
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              {selectedUserIds.map(uid => {
                const user = availableUsers.find(u => u.id === uid);
                return (
                  <div
                    key={uid}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                  >
                    <Avatar src={user?.avatar} name={user?.name} size="xs" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{user?.name?.split(' ')[0]}</span>
                    <button
                      type="button"
                      onClick={() => toggleUser(uid)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Picker List */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Add Members
          </label>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            {availableUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className="py-2 px-2.5 flex items-center justify-between cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!groupName.trim() || loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
