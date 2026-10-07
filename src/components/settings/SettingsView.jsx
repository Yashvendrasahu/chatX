import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import {
  User,
  Moon,
  Sun,
  Bell,
  Volume2,
  Shield,
  Lock,
  Smartphone,
  Info,
  LogOut,
  Sparkles,
  Palette,
  Check,
  CheckCircle2
} from 'lucide-react';

export function SettingsView({ onOpenProfile }) {
  const { currentUser, logout, switchUser, availableUsers, fbUser, loginWithGoogle } = useAuth();
  const { theme, toggleTheme, chatWallpaper, updateWallpaper } = useTheme();

  // Settings local states
  const [readReceipts, setReadReceipts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(true);
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState('Everyone');

  const wallpapers = [
    { id: 'default', name: 'Classic Slate', color: '#f1f5f9' },
    { id: 'emerald', name: 'Mint Emerald', color: '#ecfdf5' },
    { id: 'indigo', name: 'Night Indigo', color: '#eef2ff' },
    { id: 'dark', name: 'Deep Onyx', color: '#0b141a' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Application Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Personalize your ChatX experience</p>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Card Header */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="lg" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{currentUser.username}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{currentUser.bio}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Edit
          </button>
        </div>

        {/* Firebase Cloud & Auth Status */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Firebase Cloud Sync: Connected
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Cloud Firestore</span>
          </div>

          {fbUser ? (
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs text-slate-300 font-medium">Logged in via Google Account</p>
                <p className="text-[11px] text-slate-400">{fbUser.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                Verified
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-300">Link your Google account to sync profile to cloud</p>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <span>Link Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Demo User Switcher (For rapid testing) */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Instant Account Switcher (Realtime Testing)
              </h4>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Switch active user with 1 click to test 2-way real-time messaging, audio calls, and typing indicators.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'user_raju', name: 'Raju Sharma', username: 'raju', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raju&backgroundColor=b6e3f4' },
              { id: 'user_sarah', name: 'Sarah Chen', username: 'sarah_c', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc' },
              { id: 'user_alex', name: 'Alex Rivera', username: 'alex_r', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9' },
              { id: 'user_priya', name: 'Priya Patel', username: 'priya_p', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=c0aede' }
            ].map(u => {
              const isCurrent = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => switchUser(u)}
                  className={`p-2 rounded-xl flex items-center gap-2 text-left border transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <Avatar src={u.avatar} name={u.name} size="xs" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{u.name.split(' ')[0]}</div>
                    <div className={`text-[10px] truncate ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                      @{u.username}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dark Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Toggle dark / light appearance</div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Privacy & Security</span>
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Read Receipts (Blue Ticks)</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">If turned off, you won't send or see read receipts</div>
            </div>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Last Seen Visibility</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Who can see when you were last online</div>
            </div>
            <select
              value={lastSeenPrivacy}
              onChange={(e) => setLastSeenPrivacy(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-0 text-slate-800 dark:text-slate-200"
            >
              <option value="Everyone">Everyone</option>
              <option value="Contacts">My Contacts</option>
              <option value="Nobody">Nobody</option>
            </select>
          </div>
        </div>

        {/* Notifications & Sounds */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Notifications & Audio</span>
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Message Sounds</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Play subtle chimes for incoming messages</div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Desktop Push Notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Show notification alerts for new chats</div>
            </div>
            <input
              type="checkbox"
              checked={desktopNotifs}
              onChange={(e) => setDesktopNotifs(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Logout & App Info */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-500" />
            <span>ChatX Web · v2.0 Production</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
