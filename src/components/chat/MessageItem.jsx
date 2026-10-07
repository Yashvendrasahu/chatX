import React, { useState, useRef, useEffect } from 'react';
import { formatMessageTime, formatFileSize, formatDuration } from '../../utils/formatters.js';
import { Check, CheckCheck, Play, Pause, FileText, Download, Reply, Edit3, Trash2, Copy, MoreVertical, CornerUpRight, Volume2 } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';

export function MessageItem({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onForward
}) {
  const isMine = message.senderId === currentUserId;
  const isSystem = message.type === 'system';
  const isDeleted = message.isDeleted;

  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(message.duration || 0);
  const audioRef = useRef(null);

  // Audio Player handling for voice notes
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || audioDuration || 1;
      setAudioProgress((current / total) * 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
    setShowMenu(false);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-400 max-w-xs text-center shadow-xs">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col mb-1.5 px-3 md:px-6 transition-colors ${
        isMine ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-2.5 shadow-xs transition-all ${
          isMine
            ? 'bg-emerald-600 dark:bg-emerald-600 text-white rounded-tr-xs'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/70 dark:border-slate-700/60'
        }`}
      >
        {/* Group Sender Name in incoming message */}
        {!isMine && message.senderName && (
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
            <span>{message.senderName}</span>
          </div>
        )}

        {/* Quoted Reply Banner */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-lg text-xs border-l-3 ${
              isMine
                ? 'bg-emerald-700/50 border-emerald-300 text-emerald-100'
                : 'bg-slate-100 dark:bg-slate-700/60 border-emerald-500 text-slate-600 dark:text-slate-300'
            }`}
          >
            <div className="font-semibold text-[10px] opacity-90">{message.replyTo.senderName}</div>
            <div className="truncate">{message.replyTo.text || 'Media attachment'}</div>
          </div>
        )}

        {/* Deleted Message State */}
        {isDeleted ? (
          <div className="flex items-center gap-1.5 text-xs italic opacity-70 py-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>This message was deleted</span>
          </div>
        ) : (
          <>
            {/* Image Attachment */}
            {message.type === 'image' && message.mediaUrl && (
              <div className="mb-2 rounded-xl overflow-hidden max-h-80 bg-slate-900">
                <img
                  src={message.mediaUrl}
                  alt={message.fileName || 'Attachment'}
                  className="w-full h-auto object-cover max-h-80 rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                  onClick={() => window.open(message.mediaUrl, '_blank')}
                />
              </div>
            )}

            {/* Video Attachment */}
            {message.type === 'video' && message.mediaUrl && (
              <div className="mb-2 rounded-xl overflow-hidden max-h-80 bg-black">
                <video
                  src={message.mediaUrl}
                  controls
                  className="w-full max-h-80 rounded-xl"
                />
              </div>
            )}

            {/* Voice Note / Audio Attachment */}
            {message.type === 'audio' && message.mediaUrl && (
              <div className="flex items-center gap-3 py-1 pr-2 min-w-[200px] sm:min-w-[240px]">
                <audio
                  ref={audioRef}
                  src={message.mediaUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={handleAudioEnded}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setAudioDuration(audioRef.current.duration);
                  }}
                />
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-90 ${
                    isMine
                      ? 'bg-white text-emerald-600'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div className="flex-1">
                  {/* Visual Waveform Bar */}
                  <div className="h-4 flex items-center gap-0.5 cursor-pointer">
                    {[12, 24, 16, 28, 8, 20, 26, 14, 18, 30, 22, 10, 16, 24, 18].map((h, i) => {
                      const barPercent = (i / 15) * 100;
                      const isPlayed = audioProgress >= barPercent;
                      return (
                        <div
                          key={i}
                          style={{ height: `${h}px` }}
                          className={`w-1 rounded-full transition-colors ${
                            isPlayed
                              ? isMine ? 'bg-white' : 'bg-emerald-600 dark:bg-emerald-400'
                              : isMine ? 'bg-emerald-400/60' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1 opacity-80 font-mono">
                    <span>{formatDuration(audioRef.current?.currentTime || 0)}</span>
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Voice Note
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Document / File Attachment */}
            {message.type === 'document' && (
              <div
                className={`flex items-center gap-3 p-2.5 mb-1.5 rounded-xl ${
                  isMine
                    ? 'bg-emerald-700/40 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{message.fileName || 'Document'}</div>
                  <div className="text-[10px] opacity-75">{formatFileSize(message.fileSize)}</div>
                </div>
                {message.mediaUrl && (
                  <a
                    href={message.mediaUrl}
                    download={message.fileName || 'download'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {/* Text Message Content */}
            {message.text && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
                {message.text}
              </div>
            )}
          </>
        )}

        {/* Message Footer: Timestamp, Edited flag & Delivery Status */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
            isMine ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          {message.isEdited && <span className="italic mr-1">edited</span>}
          <span>{formatMessageTime(message.createdAt)}</span>

          {isMine && !isDeleted && (
            <span className="inline-flex items-center ml-0.5">
              {message.status === 'sent' && (
                <Check className="w-3.5 h-3.5 opacity-80" />
              )}
              {message.status === 'delivered' && (
                <CheckCheck className="w-3.5 h-3.5 opacity-80" />
              )}
              {message.status === 'read' && (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-200 dark:text-cyan-300 font-bold" />
              )}
            </span>
          )}
        </div>

        {/* Context Menu Trigger */}
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className={`absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity ${
            isMine
              ? 'text-emerald-200 hover:text-white hover:bg-emerald-700/50'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title="Message options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Context Action Menu Popup */}
        {showMenu && (
          <div
            className={`absolute z-30 top-7 ${
              isMine ? 'right-0' : 'left-0'
            } w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100`}
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={() => { onReply(message); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Reply className="w-3.5 h-3.5 text-slate-500" />
              <span>Reply</span>
            </button>

            {message.text && !isDeleted && (
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Text</span>
              </button>
            )}

            {isMine && !isDeleted && message.type === 'text' && (
              <button
                onClick={() => { onEdit(message); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Edit</span>
              </button>
            )}

            {onForward && !isDeleted && (
              <button
                onClick={() => { onForward(message); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <CornerUpRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Forward</span>
              </button>
            )}

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            <button
              onClick={() => { onDelete(message, false); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete for me</span>
            </button>

            {isMine && !isDeleted && (
              <button
                onClick={() => { onDelete(message, true); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete for everyone</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
