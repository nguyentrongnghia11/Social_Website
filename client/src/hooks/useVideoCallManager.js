import { useEffect, useRef } from 'react';
import { onEvent, offEvent, emitEvent, getSocket, onSocketConnectionChange } from '../helpers/socketHelper';
import useVideoCallStore from '../stores/useVideoCallStore';
import { webRTCManager } from '../managers/WebRTCManager';

export const useVideoCallManager = () => {
  const {
    incomingCall,
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    handleIncomingCall,
    handleCallInitiated,
    handleCallOffer,
    handleCallAnswer,
    handleIceCandidate,
    handleCallRejected,
    handleCallEnded,
    endCall,
  } = useVideoCallStore();

  // Ringtone refs
  const ringtoneIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // ============= RINGTONE LOGIC =============
  const playRingtone = () => {
    try {
      stopRingtone();

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const playBeep = () => {
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 440;
          gainNode.gain.value = 0.3;

          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            oscillator.disconnect();
          }, 200);
        } catch (err) {
          console.error('Error playing beep:', err);
        }
      };

      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 1000);
    } catch (error) {
      console.error('Cannot play ringtone:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
      audioContextRef.current = null;
    }
  };

  // ============= SOCKET EVENT REGISTRATION =============
  useEffect(() => {
    const registerListeners = () => {
      console.log('📡 Registering socket listeners...');
      
      onEvent('call-incoming', handleIncomingCall);
      onEvent('call-initiated', handleCallInitiated);
      onEvent('call-offer', handleCallOffer);
      onEvent('call-answer', handleCallAnswer);
      onEvent('call-ice-candidate', handleIceCandidate);
      onEvent('call-rejected', handleCallRejected);
      onEvent('call-ended', handleCallEnded);
    };

    const socket = getSocket();
    if (socket?.connected) {
      registerListeners();
    }

    const unsubscribe = onSocketConnectionChange((connected) => {
      if (connected) {
        registerListeners();
      }
    });

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      stopRingtone();
      
      offEvent('call-incoming', handleIncomingCall);
      offEvent('call-initiated', handleCallInitiated);
      offEvent('call-offer', handleCallOffer);
      offEvent('call-answer', handleCallAnswer);
      offEvent('call-ice-candidate', handleIceCandidate);
      offEvent('call-rejected', handleCallRejected);
      offEvent('call-ended', handleCallEnded);
      
      unsubscribe();
    };
  }, [
    handleIncomingCall,
    handleCallInitiated,
    handleCallOffer,
    handleCallAnswer,
    handleIceCandidate,
    handleCallRejected,
    handleCallEnded,
  ]);

  // ============= RINGTONE CONTROL =============
  useEffect(() => {
    if (callStatus === 'idle' || !incomingCall) {
      stopRingtone();
    } else if (incomingCall && callStatus === 'ringing') {
      playRingtone();
    }
  }, [callStatus, incomingCall]);

  // ============= CLEANUP ON PAGE UNLOAD =============
  useEffect(() => {
    const handleBeforeUnload = () => {
      webRTCManager.cleanup();
      
      if (activeCall?.callId) {
        emitEvent('call-end', {
          callId: activeCall.callId,
          otherUserId: activeCall.receiverId
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeCall]);

  return {
    incomingCall,
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    webRTCManager, // Export for debugging purposes
  };
};

