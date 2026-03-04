import { useEffect, useRef } from 'react';
import { onEvent, offEvent, emitEvent, getSocket, onSocketConnectionChange } from '../helpers/socketHelper';
import { isLoggedIn } from '../helpers/authHelper';
import useVideoCallStore from '../stores/useVideoCallStore';

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

/**
 * Custom hook to manage WebRTC video call lifecycle
 * This hook should be called once at the app root level
 */
export const useVideoCallManager = () => {
  const {
    incomingCall,
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    setLocalStream,
    setRemoteStream,
    setCallStatus,
    handleIncomingCall,
    handleCallInitiated,
    handleCallOffer,
    handleCallAnswer,
    handleIceCandidate,
    handleCallRejected,
    handleCallEnded,
    endCall: storeEndCall,
  } = useVideoCallStore();

  // Refs for WebRTC and media management
  const ringtoneIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const processedAnswerRef = useRef(false);
  const currentCallIdRef = useRef(null);
  const reconnectionAttemptRef = useRef(0);

  const user = isLoggedIn();

  // Keep refs in sync with store state
  useEffect(() => {
    localStreamRef.current = localStream;
    remoteStreamRef.current = remoteStream;
  }, [localStream, remoteStream]);

  // Ringtone functions
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

  // Cleanup function
  const cleanupMediaAndPeerConnection = () => {
    console.log('🧹 [Cleanup] Starting cleanup...');

    stopRingtone();

    // Cleanup local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Cleanup remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }

    // Cleanup peer connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onsignalingstatechange = null;
        peerConnectionRef.current.onicegatheringstatechange = null;
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

    console.log('✅ [Cleanup] Cleanup completed');
  };

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
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

  // Register socket listeners
  useEffect(() => {
    const registerListeners = () => {
      console.log('📋 Registering socket listeners');

      onEvent('call-incoming', handleIncomingCall);
      onEvent('call-initiated', handleCallInitiated);
      onEvent('call-offer', handleCallOffer);
      onEvent('call-answer', handleCallAnswer);
      onEvent('call-ice-candidate', handleIceCandidate);
      onEvent('call-rejected', (data) => {
        handleCallRejected(data);
        cleanupMediaAndPeerConnection();
      });
      onEvent('call-ended', () => {
        handleCallEnded();
        cleanupMediaAndPeerConnection();
      });
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
      console.log('🧹 Cleanup listeners');
      stopRingtone();
      cleanupMediaAndPeerConnection();
      unsubscribe();
      
      offEvent('call-incoming', handleIncomingCall);
      offEvent('call-initiated', handleCallInitiated);
      offEvent('call-offer', handleCallOffer);
      offEvent('call-answer', handleCallAnswer);
      offEvent('call-ice-candidate', handleIceCandidate);
      offEvent('call-rejected', handleCallRejected);
      offEvent('call-ended', handleCallEnded);
    };
  }, []);

  // Handle ringtone
  useEffect(() => {
    if (callStatus === 'idle' || !incomingCall) {
      stopRingtone();
    } else if (incomingCall && callStatus === 'ringing') {
      playRingtone();
    }
  }, [callStatus, incomingCall]);

  // Cleanup when activeCall becomes null
  useEffect(() => {
    if (!activeCall) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
        remoteStreamRef.current = null;
        setRemoteStream(null);
      }
    }
  }, [activeCall, setLocalStream, setRemoteStream]);

  // Initialize local media stream
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

        console.log('🎥 Getting local media stream');
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        console.log('✅ Got local stream');
      } catch (error) {
        console.error('❌ Cannot access camera/mic:', error);
        const errorMessage = error.name === 'NotAllowedError' 
          ? 'Bạn đã từ chối quyền truy cập camera/microphone'
          : error.name === 'NotFoundError'
          ? 'Không tìm thấy camera/microphone'
          : 'Không thể truy cập camera/microphone';
        
        setCallStatus(errorMessage);
        alert(errorMessage + '. Vui lòng kiểm tra cài đặt.');
        storeEndCall();
        cleanupMediaAndPeerConnection();
      }
    };

    initLocalStream();

    return () => {
      mounted = false;
    };
  }, [activeCall?.callId]);

  // Create peer connection
  useEffect(() => {
    if (!localStream || !activeCall || !activeCall.callId) {
      return;
    }

    if (peerConnectionRef.current && currentCallIdRef.current === activeCall.callId) {
      return;
    }

    if (peerConnectionRef.current) {
      if (currentCallIdRef.current !== activeCall.callId) {
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

    console.log('🔨 Creating peer connection for callId:', activeCall.callId);
    currentCallIdRef.current = activeCall.callId;

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    console.log('📤 Adding local tracks to peer connection:', localStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
    const transceivers = [];
    localStream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, localStream);
      console.log('✅ Added track:', track.kind, 'sender:', sender);
      transceivers.push(pc.getTransceivers().find(t => t.sender === sender));
    });
    
    console.log('📋 Transceivers after adding tracks:', transceivers.map(t => ({
      direction: t.direction,
      currentDirection: t.currentDirection,
      mid: t.mid
    })));

    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall.callId) {
        console.log('🧊 Sending ICE candidate:', event.candidate.type);
        emitEvent('call-ice-candidate', {
          callId: activeCall.callId,
          targetUserId: activeCall.receiverId,
          candidate: event.candidate,
        });
      } else if (!event.candidate) {
        console.log('✅ ICE gathering complete');
      }
    };

    pc.ontrack = (event) => {
      console.log('📡 ontrack event triggered:', {
        streams: event.streams.length,
        track: event.track.kind,
        trackEnabled: event.track.enabled
      });
      
      const [stream] = event.streams;
      if (stream) {
        console.log('📡 Received remote stream with tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      } else {
        console.warn('⚠️ No stream in ontrack event');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ Peer connection fully established');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ Peer connection failed');
      } else if (pc.connectionState === 'disconnected') {
        console.warn('⚠️ Peer connection disconnected');
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('🔔 Signaling state changed:', pc.signalingState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', pc.iceConnectionState);
      console.log('🔌 ICE gathering state:', pc.iceGatheringState);
      console.log('🔗 Connection state:', pc.connectionState);
      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          setCallStatus('Đã kết nối');
          reconnectionAttemptRef.current = 0;
          break;
        case 'disconnected':
          setCallStatus('Mất kết nối');
          setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected' && reconnectionAttemptRef.current < 3) {
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
          if (reconnectionAttemptRef.current < 2) {
            reconnectionAttemptRef.current++;
            try {
              pc.restartIce();
            } catch (error) {
              console.error('❌ Error restarting ICE:', error);
            }
          } else {
            setTimeout(() => {
              if (pc.iceConnectionState === 'failed') {
                alert('Không thể kết nối. Vui lòng thử lại.');
                storeEndCall();
                cleanupMediaAndPeerConnection();
              }
            }, 3000);
          }
          break;
        case 'closed':
          setCallStatus('Đã đóng');
          reconnectionAttemptRef.current = 0;
          break;
      }
    };

    if (activeCall.isInitiator) {
      (async () => {
        try {
          console.log('📞 Creating offer as initiator');
          
          const offerDesc = await pc.createOffer();
          console.log('📤 Created offer:', offerDesc.type);
          console.log('📋 Offer SDP has audio:', offerDesc.sdp.includes('m=audio'));
          console.log('📋 Offer SDP has video:', offerDesc.sdp.includes('m=video'));

          await pc.setLocalDescription(offerDesc);
          console.log('✅ Set local description (offer)');

          emitEvent('call-offer', {
            callId: activeCall.callId,
            receiverId: activeCall.receiverId,
            offer: offerDesc,
          });

          console.log('📡 Sent offer to receiver');
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

  // Handle offer and send answer
  useEffect(() => {
    if (!activeCall?.offer || !peerConnectionRef.current || activeCall?.isInitiator || !localStream) {
      if (activeCall?.offer && !activeCall?.isInitiator) {
        console.log('⏸️ Waiting for local setup before handling offer:', {
          hasPeerConnection: !!peerConnectionRef.current,
          hasLocalStream: !!localStream
        });
      }
      return;
    }

    // Ensure local tracks have been added before handling offer
    const transceivers = peerConnectionRef.current.getTransceivers();
    if (transceivers.length === 0) {
      console.log('⏸️ Waiting for local tracks to be added to peer connection');
      return;
    }

    console.log('✅ Local setup complete, ready to handle offer');

    const handleOffer = async () => {
      try {
        console.log('📨 Handling received offer');
        const pc = peerConnectionRef.current;
        
        console.log('🔄 Setting remote description (offer)');
        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer));
        console.log('✅ Remote description set');

        console.log('📞 Creating answer');
        const answerDesc = await pc.createAnswer();
        console.log('✅ Created answer:', answerDesc.type);
        console.log('📋 Answer SDP has audio:', answerDesc.sdp.includes('m=audio'));
        console.log('📋 Answer SDP has video:', answerDesc.sdp.includes('m=video'));
        
        await pc.setLocalDescription(answerDesc);
        console.log('✅ Set local description (answer)');

        console.log('📡 Emitting answer to caller:', activeCall.receiverId);
        const emitSuccess = emitEvent('call-answer', {
          callId: activeCall.callId,
          callerId: activeCall.receiverId,
          answer: answerDesc,
        });

        if (!emitSuccess) {
          console.error('❌ Failed to emit call-answer');
        } else {
          console.log('✅ call-answer emitted successfully');
        }

        console.log('📡 Sent answer to caller');
        setCallStatus('Đang kết nối...');

        console.log('🧊 Processing', iceCandidatesQueue.current.length, 'queued ICE candidates');
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ Added queued candidate');
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
        console.log('✅ All queued candidates processed');
      } catch (error) {
        console.error('❌ Error handling offer:', error);
        setCallStatus('Lỗi kết nối');
      }
    };

    handleOffer();
  }, [activeCall?.offer, activeCall?.isInitiator, localStream]);

  // Handle answer from receiver
  useEffect(() => {
    if (!activeCall?.answer || !peerConnectionRef.current || !activeCall?.isInitiator) return;

    const handleAnswer = async () => {
      try {
        console.log('📨 Received answer from receiver');
        const pc = peerConnectionRef.current;

        console.log('🔍 Signaling state:', pc.signalingState);
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('⚠️ Invalid signaling state for answer:', pc.signalingState);
          return;
        }

        if (processedAnswerRef.current) {
          console.log('⚠️ Answer already processed');
          return;
        }

        processedAnswerRef.current = true;

        console.log('🔄 Setting remote description (answer)');
        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.answer));
        console.log('✅ Remote description set (answer)');

        setCallStatus('Đang kết nối...');

        console.log('🧊 Processing', iceCandidatesQueue.current.length, 'queued ICE candidates');
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ Added queued candidate');
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
        console.log('✅ All queued candidates processed (caller side)');
      } catch (error) {
        console.error('❌ Error handling answer:', error);
        setCallStatus('Lỗi kết nối');
        processedAnswerRef.current = false;
      }
    };

    handleAnswer();
  }, [activeCall?.answer, activeCall?.isInitiator]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (!activeCall?.newIceCandidate || !peerConnectionRef.current) return;

    const handleIceCandidate = async () => {
      try {
        const pc = peerConnectionRef.current;
        const hasRemoteDesc = pc.remoteDescription && pc.remoteDescription.type;
        
        console.log('🧊 Received ICE candidate, remote desc:', hasRemoteDesc ? 'YES' : 'NO');

        if (hasRemoteDesc) {
          await pc.addIceCandidate(new RTCIceCandidate(activeCall.newIceCandidate));
          console.log('✅ Added ICE candidate immediately');
        } else {
          iceCandidatesQueue.current.push(activeCall.newIceCandidate);
          console.log('📦 Queued ICE candidate, queue length:', iceCandidatesQueue.current.length);
        }
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    };

    handleIceCandidate();
  }, [activeCall?.newIceCandidate, activeCall?.iceCandidateTimestamp]);

  // Process queued ICE candidates
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
};
