import React from 'react';
import { MessageSquare, Shield, Smartphone, Laptop, Sparkles } from 'lucide-react';

export function EmptyChat({ onStartNewChat }) {
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-slate-100/70 dark:bg-slate-950 text-center relative overflow-hidden select-none border-l border-slate-200/80 dark:border-slate-800">
      <div className="relative z-10 max-w-md flex flex-col items-center">
        {/* Animated Brand Emblem */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-6 flex items-center justify-center">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-9 h-9 fill-current" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          ChatX for Web
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Send and receive messages in real time with high-speed WebSockets, crystal clear voice & video calls, audio notes, and temporary stories.
        </p>

        <button
          type="button"
          onClick={onStartNewChat}
          className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start a New Conversation</span>
        </button>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 mt-10 w-full text-left">
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80">
            <Smartphone className="w-5 h-5 text-emerald-500 mb-1.5" />
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mobile & Desktop Sync</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fluid responsive layout</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/80">
            <Shield className="w-5 h-5 text-teal-500 mb-1.5" />
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">End-to-End Encryption</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Private by architecture</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span>Your personal messages and calls are secure.</span>
      </div>
    </div>
  );
}
