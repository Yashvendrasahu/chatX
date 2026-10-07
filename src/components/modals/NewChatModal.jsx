import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Search, MessageSquarePlus, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function NewChatModal({ isOpen, onClose, onSelectUser }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchTerm)}`, {
          headers: { 'x-user-id': currentUser.id }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isOpen, searchTerm, currentUser.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Conversation">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or @username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        {/* User Search Results List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading contacts...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No users found</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="py-3 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="md"
                    online={user.online}
                    showStatus={true}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate font-mono">
                      @{user.username}
                    </div>
                    {user.bio && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xs">
                        {user.bio}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Start Chat</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
