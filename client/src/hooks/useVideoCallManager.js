import { useEffect, useRef } from 'react';
import { onEvent, offEvent, emitEvent, getSocket, onSocketConnectionChange } from '../helpers/socketHelper';
import { isLoggedIn } from '../helpers/authHelper';
import useVideoCallStore from '../stores/useVideoCallStore';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

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

  // Cleanup function
  const cleanupMediaAndPeerConnection = () => {
    console.log('cleanuppp');

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
        console.error('close peer connection:', error);
      }
      peerConnectionRef.current = null;
    }

    iceCandidatesQueue.current = [];
    processedAnswerRef.current = false;
    currentCallIdRef.current = null;
    reconnectionAttemptRef.current = 0;

    console.log('Cleanup peer connection ');
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

    console.log('Regis success');

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
      console.log('Cleanup listeners');
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
        console.log('Get local stream');
      } catch (error) {
        console.error('Cannot access camera/mic:', error);
        setCallStatus("Lỗi thiết bị");
        alert('Permission co van de');
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
          console.error('Error closing old peer:', error);
        }
        peerConnectionRef.current = null;
        iceCandidatesQueue.current = [];
        processedAnswerRef.current = false;
      } else {
        return;
      }
    }

    currentCallIdRef.current = activeCall.callId;

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    const transceivers = [];
    localStream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, localStream);
      console.log('Added track:', track.kind, 'sender:', sender);
      transceivers.push(pc.getTransceivers().find(t => t.sender === sender));
    });
    


    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall.callId) {
        console.log('Sending ICE candidate:', event.candidate.type);
        emitEvent('call-ice-candidate', {
          callId: activeCall.callId,
          targetUserId: activeCall.receiverId,
          candidate: event.candidate,
        });
      } else if (!event.candidate) {
        console.log('ICE gathering complete');
      }
    };

    pc.ontrack = (event) => {
      console.log('ontrack event triggered:', {
        streams: event.streams.length,
        track: event.track.kind,
        trackEnabled: event.track.enabled
      });
      
      const [stream] = event.streams;
      if (stream) {
        console.log('Received remote stream with tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      } else {
        console.warn('No stream in ontrack event');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('Peer connection fully established');
      } else if (pc.connectionState === 'failed') {
        console.error('Peer connection failed');
      } else if (pc.connectionState === 'disconnected') {
        console.warn('Peer connection disconnected');
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('Signaling state changed:', pc.signalingState);
    };

    pc.oniceconnectionstatechange = () => {

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
                console.error('Error restarting ICE:', error);
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
              console.error('Error restarting ICE:', error);
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
          
          const offerDesc = await pc.createOffer();

          await pc.setLocalDescription(offerDesc);
          console.log('Set local description (offer)');

          emitEvent('call-offer', {
            callId: activeCall.callId,
            receiverId: activeCall.receiverId,
            offer: offerDesc,
          });

          console.log('Sent offer to receiver');
          setCallStatus('Đang gọi...');
        } catch (error) {
          console.error('Error creating offer:', error);
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
      return;
    }

    // Ensure local tracks have been added before handling offer
    const transceivers = peerConnectionRef.current.getTransceivers();
    if (transceivers.length === 0) {
      return;
    }

    console.log('Local setup complete, ready to handle offer');

    const handleOffer = async () => {
      try {
        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer));
        const answerDesc = await pc.createAnswer();
        
        await pc.setLocalDescription(answerDesc);
        const emitSuccess = emitEvent('call-answer', {
          callId: activeCall.callId,
          callerId: activeCall.receiverId,
          answer: answerDesc,
        });

        if (!emitSuccess) {
          console.error('Failed to emit call-answer');
        } else {
          console.log('call-answer emitted successfully');
        }

        setCallStatus('Đang kết nối...');
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding queued ICE candidate:', error);
          }
        }
        console.log('All queued candidates processed');
      } catch (error) {
        console.error('Error handling offer:', error);
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
        const pc = peerConnectionRef.current;
        if (pc.signalingState !== 'have-local-offer') {
          return;
        }

        if (processedAnswerRef.current) {
          return;
        }

        processedAnswerRef.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(activeCall.answer));
        setCallStatus('Đang kết nối...');

        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding queued ICE candidate:', error);
          }
        }
        console.log('All queued candidates processed (caller side)');
      } catch (error) {
        console.error('Error handling answer:', error);
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
        } else {
          iceCandidatesQueue.current.push(activeCall.newIceCandidate);
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    };

    handleIceCandidate();
  }, [activeCall?.newIceCandidate, activeCall?.iceCandidateTimestamp]);

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
          console.error('Error adding queued ICE candidate:', error);
        }
      }
    };

    processQueuedCandidates();
  }, [activeCall?.iceCandidates]);
};
