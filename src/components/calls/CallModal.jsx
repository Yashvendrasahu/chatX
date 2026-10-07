import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { formatDuration } from '../../utils/formatters.js';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';

export function CallModal() {
  const {
    callState,
    callType,
    peerUser,
    isMuted,
    isVideoEnabled,
    isSpeakerOn,
    callDuration,
    localStream,
    remoteStream,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  if (callState === 'idle') return null;

  // 1. Incoming Call Dialog Popover
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white shadow-2xl flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 absolute -inset-2 animate-ping" />
            <Avatar src={peerUser?.avatar} name={peerUser?.name} size="2xl" />
          </div>

          <h3 className="text-xl font-bold">{peerUser?.name || 'Incoming Caller'}</h3>
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mt-1 flex items-center gap-1.5 justify-center">
            {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>Incoming {callType} Call...</span>
          </p>

          <div className="flex items-center gap-8 mt-10">
            {/* Decline */}
            <button
              type="button"
              onClick={rejectCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-90"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={answerCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-90 animate-bounce"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Outgoing / Connected Active Call View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-full sm:h-[620px] bg-slate-950 sm:rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Header */}
        <div className="relative z-20 p-6 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent">
          <div>
            <h3 className="text-lg font-bold">{peerUser?.name || 'User'}</h3>
            <p className="text-xs text-emerald-400 font-mono">
              {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeaker}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                isSpeakerOn ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
              }`}
              title="Toggle Speaker"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Video or Audio Canvas Area */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
          {callType === 'video' ? (
            <>
              {/* Simulated / Remote Video Backdrop */}
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Avatar src={peerUser?.avatar} name={peerUser?.name} size="2xl" className="mx-auto mb-3" />
                  <p className="text-sm font-medium">{peerUser?.name}</p>
                </div>
              </div>

              {/* Local Video Picture-in-Picture Preview */}
              <div className="absolute top-20 right-6 w-36 h-48 sm:w-44 sm:h-56 bg-black rounded-2xl border-2 border-slate-700/80 overflow-hidden shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                />
                {!isVideoEnabled && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 text-xs">
                    <VideoOff className="w-6 h-6 mb-1" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Call Center Visual */
            <div className="text-center z-10 flex flex-col items-center">
              <div className="relative mb-6">
                {callState === 'calling' && (
                  <div className="w-32 h-32 rounded-full bg-emerald-500/20 absolute -inset-4 animate-ping" />
                )}
                <Avatar src={peerUser?.avatar} name={peerUser?.name} size="2xl" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">{peerUser?.name}</h4>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                End-to-End Encrypted Voice
              </span>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="relative z-20 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-500/30 text-rose-400 border border-rose-500/50' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video (If video call) */}
          {callType === 'video' && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isVideoEnabled ? 'bg-rose-500/30 text-rose-400 border border-rose-500/50' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => endCall(true)}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
