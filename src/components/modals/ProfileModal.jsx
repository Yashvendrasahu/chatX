import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Camera, User, FileText, Phone, Mail, Check } from 'lucide-react';

export function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const avatarSeeds = ['Raju', 'Sarah', 'Alex', 'Priya', 'Maya', 'Jordan', 'Felix', 'Taylor'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        avatar
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAvatarUpload = async (e) => {
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
      setAvatar(data.url);
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Selector Section */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="relative group">
            <Avatar src={avatar} name={name} size="2xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity cursor-pointer"
            >
              <Camera className="w-5 h-5 mb-1" />
              <span>Change</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCustomAvatarUpload}
            />
          </div>

          {/* Quick Preset Avatars */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto py-1 max-w-full">
            {avatarSeeds.map(seed => {
              const seedUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4`;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setAvatar(seedUrl)}
                  className={`p-0.5 rounded-full ring-2 transition-transform ${
                    avatar === seedUrl ? 'ring-emerald-500 scale-110' : 'ring-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Avatar src={seedUrl} name={seed} size="xs" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Display Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Account Email & Google Status */}
        {currentUser.email && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Google Account Email
            </label>
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className="truncate">{currentUser.email}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                Firebase Synced
              </span>
            </div>
          </div>
        )}

        {/* Username (Readonly) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Username
          </label>
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 font-mono border border-slate-200/60 dark:border-slate-800">
            @{currentUser.username}
          </div>
        </div>

        {/* Bio / Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            About / Bio
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you are up to..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-transform active:scale-95"
          >
            {success ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : loading ? (
              <span>Saving...</span>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
