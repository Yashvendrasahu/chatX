import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Modal } from '../common/Modal.jsx';
import { Plus, Eye, Clock, Image as ImageIcon, Type, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatChatListTime } from '../../utils/formatters.js';
import { db, auth } from '../../firebase.js';
import { doc, setDoc } from 'firebase/firestore';

export function StatusView() {
  const { currentUser } = useAuth();
  const [statusesData, setStatusesData] = useState({
    myStatus: null,
    recentUpdates: [],
    viewedUpdates: []
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null); // Story group being viewed
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // New Status Form state
  const [statusType, setStatusType] = useState('text');
  const [statusText, setStatusText] = useState('');
  const [statusBg, setStatusBg] = useState('linear-gradient(135deg, #059669 0%, #0d9488 100%)');
  const [statusMediaUrl, setStatusMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const storyTimerRef = useRef(null);

  const gradientOptions = [
    'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  ];

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/statuses', {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setStatusesData(data);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [currentUser.id]);

  // Handle Create Status
  const handleCreateStatus = async (e) => {
    e.preventDefault();
    if (statusType === 'text' && !statusText.trim()) return;
    if (statusType === 'image' && !statusMediaUrl) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          type: statusType,
          content: statusText,
          background: statusBg,
          mediaUrl: statusMediaUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (auth.currentUser && data.status) {
          try {
            await setDoc(doc(db, 'statuses', data.status.id), {
              ...data.status,
              createdAt: data.status.createdAt
            }, { merge: true });
          } catch (err) {
            console.warn('Firestore status sync note:', err);
          }
        }
        setShowCreateModal(false);
        setStatusText('');
        setStatusMediaUrl('');
        fetchStatuses();
      }
    } catch (err) {
      console.error('Failed to post status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Story Viewer Timer Progress
  useEffect(() => {
    if (activeStoryGroup) {
      const items = activeStoryGroup.items || [];
      const currentItem = items[activeStoryIndex];

      if (currentItem) {
        // Mark as viewed on backend
        fetch(`/api/statuses/${currentItem.id}/view`, {
          method: 'POST',
          headers: { 'x-user-id': currentUser.id }
        });
      }

      storyTimerRef.current = setTimeout(() => {
        if (activeStoryIndex < items.length - 1) {
          setActiveStoryIndex(prev => prev + 1);
        } else {
          setActiveStoryGroup(null);
          setActiveStoryIndex(0);
          fetchStatuses();
        }
      }, 5000);
    }
    return () => {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, [activeStoryGroup, activeStoryIndex, currentUser.id]);

  const openStoryViewer = (group) => {
    setActiveStoryGroup(group);
    setActiveStoryIndex(0);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Status Updates</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Temporary stories expire in 24 hours</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Status</span>
        </button>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* My Status Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => {
              if (statusesData.myStatus?.items?.length > 0) {
                openStoryViewer(statusesData.myStatus);
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            <div className="relative">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                size="lg"
                className={statusesData.myStatus?.items?.length > 0 ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                <Plus className="w-3 h-3" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {statusesData.myStatus?.items?.length > 0
                  ? `${statusesData.myStatus.items.length} update(s) · Tap to view`
                  : 'Tap to share an update with contacts'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        {statusesData.recentUpdates?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
              Recent Updates
            </h4>
            <div className="space-y-2">
              {statusesData.recentUpdates.map((group) => (
                <div
                  key={group.user.id}
                  onClick={() => openStoryViewer(group)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-xs"
                >
                  <div className="ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 rounded-full">
                    <Avatar src={group.user.avatar} name={group.user.name} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {group.user.name}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatChatListTime(group.items[group.items.length - 1]?.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewed Updates */}
        {statusesData.viewedUpdates?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
              Viewed Updates
            </h4>
            <div className="space-y-2">
              {statusesData.viewedUpdates.map((group) => (
                <div
                  key={group.user.id}
                  onClick={() => openStoryViewer(group)}
                  className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="ring-2 ring-slate-300 dark:ring-slate-700 ring-offset-2 dark:ring-offset-slate-900 rounded-full opacity-80">
                    <Avatar src={group.user.avatar} name={group.user.name} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {group.user.name}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {formatChatListTime(group.items[group.items.length - 1]?.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Interactive Story Viewer Modal */}
      {activeStoryGroup && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
          <div className="relative w-full max-w-sm h-full sm:h-[680px] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between bg-slate-900">
            {/* Top Progress Bars */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
              {activeStoryGroup.items.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all ${
                      i < activeStoryIndex
                        ? 'w-full'
                        : i === activeStoryIndex
                        ? 'w-full duration-5000 ease-linear'
                        : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Top Header User Info */}
            <div className="relative z-30 pt-7 px-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={activeStoryGroup.user.avatar}
                  name={activeStoryGroup.user.name}
                  size="sm"
                />
                <div>
                  <div className="text-xs font-bold leading-tight">{activeStoryGroup.user.name}</div>
                  <div className="text-[10px] text-white/70">
                    {formatChatListTime(activeStoryGroup.items[activeStoryIndex]?.createdAt)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryGroup(null)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Story Content Canvas */}
            <div
              style={{
                background:
                  activeStoryGroup.items[activeStoryIndex]?.type === 'text'
                    ? activeStoryGroup.items[activeStoryIndex]?.background
                    : '#000000'
              }}
              className="absolute inset-0 flex items-center justify-center p-8 text-center"
            >
              {activeStoryGroup.items[activeStoryIndex]?.type === 'text' ? (
                <div
                  style={{ color: activeStoryGroup.items[activeStoryIndex]?.textColor || '#ffffff' }}
                  className="text-xl sm:text-2xl font-bold leading-relaxed whitespace-pre-wrap select-none"
                >
                  {activeStoryGroup.items[activeStoryIndex]?.content}
                </div>
              ) : (
                <img
                  src={activeStoryGroup.items[activeStoryIndex]?.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Left / Right Tap Controls */}
            <div
              className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
              onClick={() => {
                if (activeStoryIndex > 0) setActiveStoryIndex(prev => prev - 1);
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
              onClick={() => {
                if (activeStoryIndex < activeStoryGroup.items.length - 1) {
                  setActiveStoryIndex(prev => prev + 1);
                } else {
                  setActiveStoryGroup(null);
                }
              }}
            />

            {/* Bottom Viewers Bar */}
            <div className="relative z-30 pb-4 px-4 flex items-center justify-center text-white/80 text-xs gap-1.5">
              <Eye className="w-4 h-4" />
              <span>
                {activeStoryGroup.items[activeStoryIndex]?.viewers?.length || 0} views
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create Status Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Share Status Update"
      >
        <form onSubmit={handleCreateStatus} className="space-y-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setStatusType('text')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                statusType === 'text'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusType('image')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                statusType === 'image'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>
          </div>

          {statusType === 'text' ? (
            <>
              {/* Preview Box */}
              <div
                style={{ background: statusBg }}
                className="w-full h-44 rounded-2xl p-6 flex items-center justify-center text-white font-bold text-center shadow-inner"
              >
                <textarea
                  rows={3}
                  placeholder="What's on your mind?..."
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  className="w-full bg-transparent border-0 text-white placeholder-white/70 text-center font-bold text-lg resize-none focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Gradient Palette Options */}
              <div className="flex items-center gap-2 justify-center py-2">
                {gradientOptions.map((bg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={{ background: bg }}
                    onClick={() => setStatusBg(bg)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      statusBg === bg ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onloadend = async () => {
                    const res = await fetch('/api/upload', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ data: reader.result, name: file.name, type: file.type })
                    });
                    const data = await res.json();
                    setStatusMediaUrl(data.url);
                  };
                }}
              />

              {statusMediaUrl ? (
                <div className="relative rounded-2xl overflow-hidden h-48 bg-black">
                  <img src={statusMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setStatusMediaUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">Click to select photo</span>
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95"
            >
              {isSubmitting ? 'Posting...' : 'Share Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
