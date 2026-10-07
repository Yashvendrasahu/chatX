import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Plus } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';

export function CallsView() {
  const { availableUsers, currentUser } = useAuth();
  const { startCall } = useCall();
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Sample call history log
  const callLogs = [
    {
      id: 'call_1',
      user: availableUsers.find(u => u.id === 'user_sarah') || { id: 'user_sarah', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc' },
      type: 'incoming',
      media: 'video',
      time: 'Today, 11:20 AM',
      duration: '4m 12s'
    },
    {
      id: 'call_2',
      user: availableUsers.find(u => u.id === 'user_alex') || { id: 'user_alex', name: 'Alex Rivera', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9' },
      type: 'outgoing',
      media: 'audio',
      time: 'Yesterday, 6:45 PM',
      duration: '12m 05s'
    },
    {
      id: 'call_3',
      user: availableUsers.find(u => u.id === 'user_priya') || { id: 'user_priya', name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=c0aede' },
      type: 'missed',
      media: 'audio',
      time: 'Oct 5, 2:14 PM',
      duration: 'Missed'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Voice & Video Calls</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Direct peer-to-peer WebRTC calling</p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewCallModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Call</span>
        </button>
      </div>

      {/* Call History List */}
      <div className="max-w-2xl w-full mx-auto p-4 md:p-6 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
          Recent Calls
        </h4>

        {callLogs.map((call) => (
          <div
            key={call.id}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Avatar src={call.user?.avatar} name={call.user?.name} size="md" />
              <div>
                <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {call.user?.name}
                </h5>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {call.type === 'incoming' && <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500" />}
                  {call.type === 'outgoing' && <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" />}
                  {call.type === 'missed' && <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{call.time}</span>
                  <span>·</span>
                  <span>{call.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => startCall(call.user, 'audio')}
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => startCall(call.user, 'video')}
                className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Call Selector Modal */}
      <Modal
        isOpen={showNewCallModal}
        onClose={() => setShowNewCallModal(false)}
        title="Start a Call"
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
          {availableUsers.map(user => (
            <div
              key={user.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar src={user.avatar} name={user.name} size="md" online={user.online} showStatus={true} />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                  <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    startCall(user, 'audio');
                    setShowNewCallModal(false);
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    startCall(user, 'video');
                    setShowNewCallModal(false);
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
