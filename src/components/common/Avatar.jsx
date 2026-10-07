import React, { useState } from 'react';

export function Avatar({ src, name, size = 'md', online = false, showStatus = false, className = '' }) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2 bottom-0 right-0 ring-1',
    sm: 'w-2.5 h-2.5 bottom-0 right-0 ring-1.5',
    md: 'w-3 h-3 bottom-0 right-0 ring-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 ring-2',
    xl: 'w-4 h-4 bottom-0.5 right-0.5 ring-2',
    '2xl': 'w-6 h-6 bottom-1 right-1 ring-3'
  };

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Consistent pleasant gradient background based on name
  const getGradient = (n) => {
    const gradients = [
      'from-emerald-500 to-teal-700',
      'from-indigo-500 to-purple-700',
      'from-blue-500 to-cyan-700',
      'from-rose-500 to-pink-700',
      'from-amber-500 to-orange-700',
      'from-violet-500 to-fuchsia-700'
    ];
    let hash = 0;
    if (n) {
      for (let i = 0; i < n.length; i++) {
        hash = n.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden flex items-center justify-center font-semibold text-white shadow-sm bg-gradient-to-br ${getGradient(name)}`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {showStatus && (
        <span
          className={`absolute rounded-full ring-white dark:ring-slate-900 ${statusSizeClasses[size] || statusSizeClasses.md} ${
            online ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
