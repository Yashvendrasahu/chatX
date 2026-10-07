import React, { useState } from 'react';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  {
    name: 'Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪']
  },
  {
    name: 'Hearts & Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '⭐', '🌟', '💫', '💥', '💯', '💢', '💬', '👁️‍🗨️', '🗨️', '💭', '🗯️']
  },
  {
    name: 'Objects & Tech',
    emojis: ['💻', '📱', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '💡', '🔦', '🏮', '🪔', '🔋', '🔌', '🚀', '🛸', '🛰️', '🔑', '🔒', '🔓', '🔔', '🔕']
  },
  {
    name: 'Activities',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🎯', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋']
  }
];

export function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmojis = searchTerm
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(searchTerm))
    : EMOJI_CATEGORIES.find(c => c.name === activeCategory)?.emojis || [];

  return (
    <div className="w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 flex flex-col gap-2">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border-0 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      {/* Category Tabs */}
      {!searchTerm && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeCategory === cat.name
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-transform active:scale-90"
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
