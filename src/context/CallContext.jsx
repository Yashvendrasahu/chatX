import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import { startRingtone, stopRingtone } from '../utils/soundEffects.js';

const CallContext = createContext();

export function CallProvider({ children }) {
  const { currentUser } = useAuth();
  const { on, emit } = useSocket();

  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [peerUser, setPeerUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const timerRef = useRef(null);

  // WebRTC ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Timer for connected call
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean up media streams
  const stopMediaTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(t => t.stop());
      remoteStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const endCall = useCallback((notifyRemote = true) => {
    stopRingtone();
    if (notifyRemote && peerUser) {
      emit({
        type: 'call:end',
        recipientId: peerUser.id
      });
    }
    stopMediaTracks();
    setCallState('idle');
    setPeerUser(null);
  }, [emit, peerUser, stopMediaTracks]);

  // Start outgoing call
  const startCall = useCallback(async (targetUser, type = 'audio') => {
    if (!targetUser) return;
    setPeerUser(targetUser);
    setCallType(type);
    setCallState('calling');
    startRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      localStreamRef.current = stream;
    } catch {
      // Audio/Video fallback (e.g. if camera permission denied in iframe)
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      localStreamRef.current = dest.stream;
    }

    emit({
      type: 'call:initiate',
      recipientId: targetUser.id,
      callType: type,
      caller: currentUser
    });
  }, [currentUser, emit]);

  // Accept incoming call
  const answerCall = useCallback(async () => {
    stopRingtone();
    setCallState('connected');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      localStreamRef.current = stream;
    } catch {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      localStreamRef.current = dest.stream;
    }

    if (peerUser) {
      emit({
        type: 'call:answer',
        recipientId: peerUser.id,
        answerer: currentUser
      });
    }
  }, [callType, currentUser, emit, peerUser]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    stopRingtone();
    if (peerUser) {
      emit({
        type: 'call:reject',
        recipientId: peerUser.id
      });
    }
    setCallState('idle');
    setPeerUser(null);
  }, [emit, peerUser]);

  // Toggle Microphone
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, []);

  // Toggle Camera
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  // Listen for socket call events
  useEffect(() => {
    const unsubInitiate = on('call:initiate', (data) => {
      if (callState === 'idle') {
        setPeerUser(data.caller);
        setCallType(data.callType || 'audio');
        setCallState('incoming');
        startRingtone();
      } else {
        // Busy
        emit({
          type: 'call:reject',
          recipientId: data.caller.id,
          reason: 'busy'
        });
      }
    });

    const unsubAnswer = on('call:answer', () => {
      stopRingtone();
      setCallState('connected');
    });

    const unsubReject = on('call:reject', () => {
      stopRingtone();
      setCallState('idle');
      stopMediaTracks();
      setPeerUser(null);
    });

    const unsubEnd = on('call:end', () => {
      stopRingtone();
      setCallState('idle');
      stopMediaTracks();
      setPeerUser(null);
    });

    return () => {
      unsubInitiate();
      unsubAnswer();
      unsubReject();
      unsubEnd();
    };
  }, [callState, emit, on, stopMediaTracks]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        peerUser,
        isMuted,
        isVideoEnabled,
        isSpeakerOn,
        callDuration,
        localStream: localStreamRef.current,
        remoteStream: remoteStreamRef.current,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}
