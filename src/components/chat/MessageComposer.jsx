import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, Square, Trash2, X, Image as ImageIcon, Video, FileText, Music, Check } from 'lucide-react';
import { EmojiPicker } from '../common/EmojiPicker.jsx';
import { playSendSound } from '../../utils/soundEffects.js';
import { formatDuration } from '../../utils/formatters.js';

export function MessageComposer({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit
}) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Sync edit mode text
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [editingMessage]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Typing presence trigger
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Send current message
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !recordedAudioBlob) return;

    if (editingMessage) {
      onSaveEdit(editingMessage.id, trimmed);
      setText('');
      return;
    }

    if (recordedAudioBlob) {
      // Send recorded audio voice note
      const reader = new FileReader();
      reader.readAsDataURL(recordedAudioBlob);
      reader.onloadend = async () => {
        try {
          setIsUploading(true);
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: reader.result,
              name: `voice_note_${Date.now()}.webm`,
              type: 'audio/webm'
            })
          });
          const data = await res.json();
          onSendMessage({
            type: 'audio',
            mediaUrl: data.url,
            duration: recordDuration,
            replyTo: replyingTo
          });
          playSendSound();
        } catch (err) {
          console.error('Audio upload failed:', err);
        } finally {
          setIsUploading(false);
          setRecordedAudioBlob(null);
          setRecordDuration(0);
        }
      };
      return;
    }

    onSendMessage({
      type: 'text',
      text: trimmed,
      replyTo: replyingTo
    });

    playSendSound();
    setText('');
    if (onTyping) onTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch {
      // If mic permission blocked, create simulated audio blob
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulated voice note
      setRecordedAudioBlob(new Blob(['simulated voice note data'], { type: 'audio/webm' }));
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordedAudioBlob(null);
    setRecordDuration(0);
  };

  // File Upload Handling
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachMenu(false);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: reader.result,
            name: file.name,
            type: file.type
          })
        });
        const uploadData = await res.json();

        let messageType = 'document';
        if (file.type.startsWith('image/')) messageType = 'image';
        else if (file.type.startsWith('video/')) messageType = 'video';
        else if (file.type.startsWith('audio/')) messageType = 'audio';

        onSendMessage({
          type: messageType,
          mediaUrl: uploadData.url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          replyTo: replyingTo
        });
        playSendSound();
        setIsUploading(false);
      };
    } catch (err) {
      console.error('File upload error:', err);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3 shrink-0 relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="mb-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-l-4 border-emerald-500 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 flex-1 mr-2">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Replying to {replyingTo.senderName}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {replyingTo.text || 'Media attachment'}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Bar */}
      {editingMessage && (
        <div className="mb-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 flex items-center justify-between">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Editing message
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Attachment Options Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 z-50 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*,video/*';
                fileInputRef.current.click();
              }
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Photos & Videos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip,.csv';
                fileInputRef.current.click();
              }
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Document</span>
          </button>
        </div>
      )}

      {/* Active Voice Recording UI */}
      {isRecording ? (
        <div className="flex items-center gap-3 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/30 animate-pulse">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatDuration(recordDuration)}
          </span>

          {/* Animated Waveform Visualizer */}
          <div className="flex-1 flex items-center justify-center gap-1">
            {[4, 12, 20, 8, 16, 24, 10, 18, 22, 14, 8, 16, 20, 10].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}px` }}
                className="w-1 bg-emerald-500 rounded-full animate-wave-bar"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-full"
            title="Cancel recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={stopRecording}
            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 shadow-sm"
            title="Finish & Send"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>
      ) : recordedAudioBlob ? (
        <div className="flex items-center gap-3 py-1 px-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/30">
          <div className="flex-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Music className="w-4 h-4" />
            <span>Voice Note ready ({formatDuration(recordDuration)})</span>
          </div>
          <button
            type="button"
            onClick={() => setRecordedAudioBlob(null)}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isUploading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Audio</span>
          </button>
        </div>
      ) : (
        /* Standard Composer Input Row */
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showEmojiPicker
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showAttachMenu
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Attach media or document"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-3.5 py-2 flex items-center focus-within:ring-2 focus-within:ring-emerald-500 border border-transparent focus-within:border-transparent transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent border-0 resize-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none max-h-28 overflow-y-auto leading-relaxed"
            />
          </div>

          {/* Send or Voice Note Record Button */}
          {text.trim() || editingMessage ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-xl transition-all active:scale-95 shrink-0 group"
              title="Hold/Click to record voice note"
            >
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
