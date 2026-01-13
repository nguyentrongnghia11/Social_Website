import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onEvent, offEvent, emitEvent, getSocket, onSocketConnectionChange } from '../../helpers/socketHelper';
import { isLoggedIn } from '../../helpers/authHelper';

const VideoCallContext = createContext();

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within VideoCallProvider');
  }
  return context;
};

// ICE servers configuration
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const VideoCallProvider = ({ children }) => {
  // UI States
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');

  // Media States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnectionReady, setPeerConnectionReady] = useState(false);

  // Socket state - reactive!
  const [socketConnected, setSocketConnected] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('online');

  // Refs
  const ringtoneIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const processedAnswerRef = useRef(false);
  const currentCallIdRef = useRef(null);
  const reconnectionAttemptRef = useRef(0);
  const networkCheckIntervalRef = useRef(null);

  const user = isLoggedIn();



  // Store latest state in ref for socket handlers to access
  const stateRef = useRef({ activeCall, incomingCall, callStatus, localStream, remoteStream });

  useEffect(() => {
    stateRef.current = { activeCall, incomingCall, callStatus, localStream, remoteStream };
  }, [activeCall, incomingCall, callStatus, localStream, remoteStream]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network online');
      setNetworkStatus('online');
      
      // If we have an active call, try to reconnect peer connection
      if (activeCall && peerConnectionRef.current?.iceConnectionState === 'disconnected') {
        console.log('🔄 Attempting to restart ICE...');
        peerConnectionRef.current.restartIce();
      }
    };

    const handleOffline = () => {
      console.log('🔴 Network offline');
      setNetworkStatus('offline');
      setCallStatus('Mất kết nối mạng');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeCall]);

  // Register socket listeners function
  const registerListeners = () => {
    console.log('📋 [VideoCall] Registering socket event listeners');

    onEvent('call-incoming', handleIncomingCall);
    onEvent('call-initiated', handleCallInitiated);
    onEvent('call-offer', handleCallOffer);
    onEvent('call-answer', handleCallAnswer);
    onEvent('call-ice-candidate', handleIceCandidate);
    onEvent('call-rejected', handleCallRejected);
    onEvent('call-ended', handleCallEnded);
    onEvent('call-missed', handleCallMissed);
    onEvent('call-user-offline', handleUserOffline);
    onEvent('call-error', handleCallError);
  };

  useEffect(() => {
    const socket = getSocket();

    if (socket?.connected) {
      setSocketConnected(true);
      registerListeners();
    }

    const unsubscribe = onSocketConnectionChange((connected) => {
      setSocketConnected(connected);

      if (connected) {
        console.log('🎯 [VideoCall] Registering listeners from callback');
        registerListeners();
      }
    });

    // Cleanup when component unmounts
    return () => {
      console.log('🧹 [VideoCall] Component unmounting - cleanup');
      stopRingtone();
      cleanupMediaAndPeerConnection();
      unsubscribe();
      
      // Remove all listeners
      offEvent('call-incoming', handleIncomingCall);
      offEvent('call-initiated', handleCallInitiated);
      offEvent('call-offer', handleCallOffer);
      offEvent('call-answer', handleCallAnswer);
      offEvent('call-ice-candidate', handleIceCandidate);
      offEvent('call-rejected', handleCallRejected);
      offEvent('call-ended', handleCallEnded);
      offEvent('call-missed', handleCallMissed);
      offEvent('call-user-offline', handleUserOffline);
      offEvent('call-error', handleCallError);
    };
  }, []);

  // Stop ringtone when callStatus is idle or no incoming call
  useEffect(() => {
    if (callStatus === 'idle' || !incomingCall) {
      stopRingtone();
    }
  }, [callStatus, incomingCall]);

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
          console.error('❌ Error playing beep:', err);
        }
      };

      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 1000);
    } catch (error) {
      console.error('❌ Cannot play ringtone:', error);
    }
  };

  const stopRingtone = () => {
    console.log('🔇 [stopRingtone] Stopping ringtone...', {
      hasInterval: !!ringtoneIntervalRef.current,
      hasAudioContext: !!audioContextRef.current
    });

    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
      console.log('✅ Cleared ringtone interval');
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
        console.log('✅ Closed audio context');
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
      audioContextRef.current = null;
    }
  };

  const cleanupMediaAndPeerConnection = () => {
    console.log('🧹 [Cleanup] Starting cleanup...', {
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      hasPeerConnection: !!peerConnectionRef.current,
      currentCallId: currentCallIdRef.current,
      processedAnswer: processedAnswerRef.current
    });

    // Stop ringtone first
    stopRingtone();

    // Cleanup local stream
    if (localStream) {
      console.log('🎥 Stopping local stream tracks');
      localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
    }

    // Cleanup remote stream
    if (remoteStream) {
      console.log('📺 Stopping remote stream tracks');
      remoteStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setRemoteStream(null);
    }

    // Cleanup peer connection
    if (peerConnectionRef.current) {
      console.log('🔌 Closing peer connection');
      try {
        // Remove all event handlers
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onsignalingstatechange = null;
        peerConnectionRef.current.onicegatheringstatechange = null;
        
        // Close connection
        peerConnectionRef.current.close();
      } catch (error) {
        console.error('❌ Error closing peer connection:', error);
      }
      peerConnectionRef.current = null;
    }

    iceCandidatesQueue.current = [];
    processedAnswerRef.current = false;
    currentCallIdRef.current = null;
    reconnectionAttemptRef.current = 0;
    setPeerConnectionReady(false);
    setIsMuted(false);
    setIsVideoOff(false);

    console.log('✅ [Cleanup] Cleanup completed');
  };

  // ============= SOCKET EVENT HANDLERS =============
  // Use callback pattern to avoid stale closure
  const handleIncomingCall = ({ callId, callerId, callerName, callerAvatar, conversationId, callType, timestamp }) => {
    console.log('📱 [Socket Event] Incoming call:', { callId, callerId, callerName });
    setIncomingCall({
      callId,
      callerId,
      callerName,
      callerAvatar,
      conversationId,
      callType,
      timestamp,
      offer: null,
    });
    setCallStatus('ringing');
    playRingtone();
  };

  const handleCallInitiated = ({ callId, conversationId }) => {
    console.log('📞 [Socket Event] Call initiated:', { callId, conversationId });
    setActiveCall(prev => {
      console.log('🔍 [handleCallInitiated] prev state:', prev);
      if (!prev) {
        console.warn('⚠️ ActiveCall is null when receiving callId!');
        return prev;
      }
      const updated = { ...prev, callId, conversationId };
      console.log('✅ [handleCallInitiated] Updated activeCall:', updated);
      return updated;
    });
  };

  const handleCallOffer = ({ callId, offer }) => {
    console.log('📨 [Socket Event] Received offer:', { callId });
    setIncomingCall(prev => {
      if (prev?.callId === callId) return { ...prev, offer };
      if (!prev) return { callId, offer };
      return prev;
    });

    setActiveCall(prev => {
      const shouldUpdate = prev?.callId === callId && !prev.isInitiator;
      console.log('🔍 [handleCallOffer] Checking activeCall update:', {
        hasActiveCall: !!prev,
        callIdMatch: prev?.callId === callId,
        isInitiator: prev?.isInitiator,
        shouldUpdate
      });
      return shouldUpdate ? { ...prev, offer } : prev;
    });
  };

  const handleCallAnswer = ({ answer }) => {
    console.log('✅ [Socket Event] Received answer');
    setActiveCall(prev => prev ? { ...prev, answer } : prev);
    setCallStatus('active');
    stopRingtone();
  };

  const handleIceCandidate = ({ callId, candidate }) => {
    console.log('🧊 [Socket Event] Received ICE candidate');
    let candidateHandled = false;

    setActiveCall(prev => {
      if (prev?.callId === callId) {
        candidateHandled = true;
        return {
          ...prev,
          newIceCandidate: candidate,
          iceCandidateTimestamp: Date.now(),
        };
      }
      return prev;
    });

    if (!candidateHandled) {
      setIncomingCall(prev => {
        if (prev?.callId === callId) {
          candidateHandled = true;
          return {
            ...prev,
            iceCandidates: [...(prev?.iceCandidates || []), candidate],
          };
        }
        return prev;
      });
    }
  };

  const handleCallRejected = ({ reason }) => {
    console.log('🚫 [Socket Event] Call rejected');
    setCallStatus('idle');
    setActiveCall(null);
    setIncomingCall(null);
    cleanupMediaAndPeerConnection(); // This already calls stopRingtone
    alert(reason || 'Cuộc gọi bị từ chối');
  };

  const handleCallEnded = () => {
    console.log('📴 [Socket Event] Call ended');
    setCallStatus('idle');
    setActiveCall(null);
    setIncomingCall(null);
    cleanupMediaAndPeerConnection(); // This already calls stopRingtone
  };

  const handleCallMissed = () => {
    console.log('📵 [Socket Event] Call missed');
    setCallStatus('idle');
    setActiveCall(null);
    setIncomingCall(null);
    cleanupMediaAndPeerConnection(); // This already calls stopRingtone
  };

  const handleUserOffline = () => {
    console.log('🔌 [Socket Event] User offline');
    setCallStatus('idle');
    setActiveCall(null);
    cleanupMediaAndPeerConnection(); // This already calls stopRingtone
    alert('Người dùng không trực tuyến');
  };

  const handleCallError = ({ message }) => {
    console.error('⚠️ [Socket Event] Call error:', message);
    setCallStatus('idle');
    setActiveCall(null);
    setIncomingCall(null);
    cleanupMediaAndPeerConnection(); // This already calls stopRingtone
    alert(`Lỗi: ${message}`);
  };

  // 1. Initialize local media stream
  useEffect(() => {
    if (!activeCall?.callId) return;

    let mounted = true;

    const initLocalStream = async () => {
      try {
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: activeCall.callType === 'video' ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 }
          } : false,
        };

        console.log('🎥 Getting local media stream with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          // Component unmounted, cleanup immediately
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setLocalStream(stream);
        setIsVideoOff(activeCall.callType === 'audio');
        console.log('✅ Got local stream:', stream.getTracks().map(t => `${t.kind}:${t.id}`));
      } catch (error) {
        console.error('❌ Cannot access camera/mic:', error);
        const errorMessage = error.name === 'NotAllowedError' 
          ? 'Bạn đã từ chối quyền truy cập camera/microphone'
          : error.name === 'NotFoundError'
          ? 'Không tìm thấy camera/microphone'
          : 'Không thể truy cập camera/microphone';
        
        setCallStatus(errorMessage);
        alert(errorMessage + '. Vui lòng kiểm tra cài đặt.');
        endCall();
      }
    };

    initLocalStream();

    return () => {
      mounted = false;
    };
  }, [activeCall?.callId]);

  // 2. Create peer connection when we have local stream and active call
  useEffect(() => {
    console.log('🔍 [Peer Connection Effect]:', {
      hasLocalStream: !!localStream,
      hasActiveCall: !!activeCall,
      activeCallId: activeCall?.callId,
      isInitiator: activeCall?.isInitiator,
      currentCallId: currentCallIdRef.current,
      hasPeerConnection: !!peerConnectionRef.current
    });

    if (!localStream || !activeCall || !activeCall.callId) {
      return;
    }

    // Prevent creating multiple peer connections for the same call
    if (peerConnectionRef.current && currentCallIdRef.current === activeCall.callId) {
      console.log('⏭️ Peer connection đã tồn tại cho cuộc gọi này');
      return;
    }

    // Cleanup old peer connection if switching calls
    if (peerConnectionRef.current) {
      if (currentCallIdRef.current !== activeCall.callId) {
        console.log('🔄 Đóng peer connection cũ và tạo mới');
        try {
          peerConnectionRef.current.onicecandidate = null;
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.oniceconnectionstatechange = null;
          peerConnectionRef.current.close();
        } catch (error) {
          console.error('❌ Error closing old peer:', error);
        }
        peerConnectionRef.current = null;
        iceCandidatesQueue.current = [];
        processedAnswerRef.current = false;
      } else {
        return;
      }
    }

    console.log('🔨 Tao peer connection moi cho callId:', activeCall.callId);
    currentCallIdRef.current = activeCall.callId;

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;
    setPeerConnectionReady(true);
    console.log('✅ Peer connection created and ready');

    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall.callId) {
        emitEvent('call-ice-candidate', {
          callId: activeCall.callId,
          targetUserId: activeCall.receiverId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', pc.iceConnectionState);
      switch (pc.iceConnectionState) {
        case 'connected':
          setCallStatus('Đã kết nối');
          reconnectionAttemptRef.current = 0;
          break;
        case 'completed':
          setCallStatus('Đã kết nối');
          reconnectionAttemptRef.current = 0;
          break;
        case 'disconnected':
          setCallStatus('Mất kết nối');
          console.log('⚠️ Connection disconnected, waiting for reconnection...');
          
          // Wait 5 seconds before attempting reconnection
          setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected' && reconnectionAttemptRef.current < 3) {
              console.log('🔄 Attempting to restart ICE (attempt', reconnectionAttemptRef.current + 1, ')');
              reconnectionAttemptRef.current++;
              try {
                pc.restartIce();
              } catch (error) {
                console.error('❌ Error restarting ICE:', error);
              }
            }
          }, 5000);
          break;
        case 'failed':
          setCallStatus('Kết nối thất bại');
          console.error('❌ ICE connection failed');
          
          // Try to restart ICE one more time
          if (reconnectionAttemptRef.current < 2) {
            console.log('🔄 Final attempt to restart ICE');
            reconnectionAttemptRef.current++;
            try {
              pc.restartIce();
            } catch (error) {
              console.error('❌ Error restarting ICE:', error);
            }
          } else {
            // Give up after 2 attempts
            setTimeout(() => {
              if (pc.iceConnectionState === 'failed') {
                alert('Không thể kết nối. Vui lòng thử lại.');
                endCall();
              }
            }, 3000);
          }
          break;
        case 'closed':
          setCallStatus('Đã đóng');
          reconnectionAttemptRef.current = 0;
          break;
        default:
          break;
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    if (activeCall.isInitiator) {
      (async () => {
        try {
          const offerDesc = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: activeCall.callType === 'video',
          });

          await pc.setLocalDescription(offerDesc);

          console.log('📤 [Socket Emit] Sending offer');
          emitEvent('call-offer', {
            callId: activeCall.callId,
            receiverId: activeCall.receiverId,
            offer: offerDesc,
          });

          setCallStatus('Đang gọi...');
        } catch (error) {
          console.error('❌ Error creating offer:', error);
          setCallStatus('Lỗi kết nối');
        }
      })();
    }

    return () => {
      if (!activeCall) {
        pc.close();
        peerConnectionRef.current = null;
        currentCallIdRef.current = null;
      }
    };
  }, [localStream, activeCall?.callId]);

  // 3. Receiver: Handle offer and send answer
  useEffect(() => {


    if (!activeCall?.offer || !peerConnectionRef.current || activeCall?.isInitiator) {
      console.log("khong du dieu kien de gui answer:", {
        hasOffer: !!activeCall?.offer,
        hasPeerConnection: !!peerConnectionRef.current,
        peerConnectionReady,
        isInitiator: activeCall?.isInitiator
      });
      return
    };
    const handleOffer = async () => {
      try {
        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer));

        const answerDesc = await pc.createAnswer();
        await pc.setLocalDescription(answerDesc);

        console.log('Nhan vao gui offer tra loi');
        emitEvent('call-answer', {
          callId: activeCall.callId,
          callerId: activeCall.receiverId,
          answer: answerDesc,
        });

        setCallStatus('Đang kết nối...');

        // Process queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error handling offer:', error);
        setCallStatus('Lỗi kết nối');
      }
    };

    handleOffer();
  }, [activeCall?.offer, activeCall?.isInitiator, peerConnectionReady]);

  // 5. Caller: Handle answer from receiver
  useEffect(() => {
    if (!activeCall?.answer || !peerConnectionRef.current || !activeCall?.isInitiator) return;

    const handleAnswer = async () => {
      try {
        const pc = peerConnectionRef.current;

        if (pc.signalingState !== 'have-local-offer') {
          console.log('⏭️ Skip answer - wrong state:', pc.signalingState);
          return;
        }

        if (processedAnswerRef.current) {
          console.log('⏭️ Answer already processed');
          return;
        }

        console.log('📨 [Caller] Processing answer...');
        processedAnswerRef.current = true;

        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.answer));
        console.log('✅ [Caller] Set remote description success');

        setCallStatus('Đang kết nối...');

        // Process queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error handling answer:', error);
        setCallStatus('Lỗi kết nối');
        processedAnswerRef.current = false;
      }
    };

    handleAnswer();
  }, [activeCall?.answer, activeCall?.isInitiator]);

  // 6. Handle incoming ICE candidates
  useEffect(() => {
    if (!activeCall?.newIceCandidate || !peerConnectionRef.current) return;

    const handleIceCandidate = async () => {
      try {
        const pc = peerConnectionRef.current;

        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(activeCall.newIceCandidate));
          console.log('✅ Added ICE candidate');
        } else {
          iceCandidatesQueue.current.push(activeCall.newIceCandidate);
          console.log('📦 Queued ICE candidate');
        }
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    };

    handleIceCandidate();
  }, [activeCall?.newIceCandidate, activeCall?.iceCandidateTimestamp]);

  // 7. Process queued ICE candidates from incoming call
  useEffect(() => {
    if (!activeCall?.iceCandidates || activeCall.iceCandidates.length === 0 || !peerConnectionRef.current) return;

    const processQueuedCandidates = async () => {
      const pc = peerConnectionRef.current;

      for (const candidate of activeCall.iceCandidates) {
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (error) {
          console.error('❌ Error adding queued ICE candidate:', error);
        }
      }
    };

    processQueuedCandidates();
  }, [activeCall?.iceCandidates]);

  // ============= API FUNCTIONS =============
  const startCall = (receiverId, receiverName, receiverAvatar, conversationId, callType = 'video') => {
    console.log('📞 [startCall] Called with:', { receiverId, callType, currentCallStatus: callStatus });
    console.log('📞 [startCall] Current state:', {
      hasActiveCall: !!activeCall,
      hasPeerConnection: !!peerConnectionRef.current,
      currentCallId: currentCallIdRef.current,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream
    });

    if (callStatus !== 'idle') {
      alert('Bạn đang trong cuộc gọi');
      return;
    }

    console.log('Bat dau cuoc goi den ', receiverId);
    const emitSuccess = emitEvent('call-initiate', {
      callerId: user?.user._id || user?._id,
      receiverId,
      conversationId,
      callType,
      callerName: user?.username,
      callerAvatar: user?.avatar,
    });

    if (!emitSuccess) {
      alert('Chưa kết nối socket');
      return;
    }
    setActiveCall({
      receiverId,
      receiverName,
      receiverAvatar,
      conversationId,
      callType,
      isInitiator: true,
    });
    setCallStatus('calling');
  };

  const acceptCall = () => {
    if (!incomingCall) return;

    console.log('📞 [acceptCall] Current state BEFORE accept:', {
      hasActiveCall: !!activeCall,
      hasPeerConnection: !!peerConnectionRef.current,
      currentCallId: currentCallIdRef.current,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream
    });

    console.log('Accepting call:', incomingCall.callId);
    console.log('🔍 [acceptCall] Setting activeCall with:', {
      callId: incomingCall.callId,
      isInitiator: false,
      hasOffer: !!incomingCall.offer,
      receiverId: incomingCall.callerId
    });
    setActiveCall({
      callId: incomingCall.callId,
      receiverId: incomingCall.callerId,
      receiverName: incomingCall.callerName,
      receiverAvatar: incomingCall.callerAvatar,
      conversationId: incomingCall.conversationId,
      callType: incomingCall.callType,
      isInitiator: false,
      offer: incomingCall.offer,
      iceCandidates: incomingCall.iceCandidates || [],
    });
    setCallStatus('active');
    setIncomingCall(null);
    stopRingtone();
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    console.log('📤 [Socket Emit] Rejecting call');
    emitEvent('call-reject', {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId,
      reason: 'Call rejected by user'
    });

    setIncomingCall(null);
    setCallStatus('idle');
    stopRingtone();
  };

  const endCall = () => {
    console.log('📤 [endCall] Ending call, current state:', {
      hasActiveCall: !!activeCall,
      activeCallId: activeCall?.callId,
      callStatus
    });

    if (activeCall?.callId) {
      emitEvent('call-end', {
        callId: activeCall.callId,
        otherUserId: activeCall.receiverId
      });
    }

    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus('idle');
    cleanupMediaAndPeerConnection(); // This already calls stopRingtone

    console.log('✅ [endCall] Call ended, state reset');
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && activeCall?.callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <VideoCallContext.Provider
      value={{
        // States
        incomingCall,
        activeCall,
        callStatus,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,

        // Call controls
        startCall,
        acceptCall,
        rejectCall,
        endCall,

        // Media controls
        toggleMute,
        toggleVideo,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export default VideoCallContext;
