import React, { useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Typography,
} from '@mui/material';
import { CallEnd } from '@mui/icons-material';
import { useVideoCall } from './util/VideoCallContext';

const VideoCall = ({ onCallEnd }) => {
  const {
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    endCall,
  } = useVideoCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Set local video stream
  useEffect(() => {
    if (!localStream || activeCall?.callType !== 'video') return;

    const setupLocalVideo = async () => {
      let retries = 0;
      while (retries < 10) {
        if (localVideoRef.current) {
          try {
            localVideoRef.current.srcObject = localStream;
            await localVideoRef.current.play();
            return;
          } catch (err) {
            console.warn('Local video autoplay blocked:', err.message);
            return;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }
      console.error('Failed to get local video ref after retries');
    };

    setupLocalVideo();

    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.pause();
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream, activeCall?.callType]);

  // Set remote stream
  useEffect(() => {
    if (!remoteStream) return;

    const setupRemoteMedia = async () => {
      let retries = 0;
      while (retries < 10) {
        if (activeCall?.callType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          try {
            await remoteVideoRef.current.play();
            console.log('Remote video playing successfully');
            return;
          } catch (err) {
            console.warn('Remote video play failed:', err.message);
          }
          return;
        } else if (activeCall?.callType === 'audio' && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          try {
            await remoteAudioRef.current.play();
          } catch (err) {
            console.error('Remote audio play error:', err);
          }
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }
      console.error('Failed to get video ref after retries');
    };

    setupRemoteMedia();

    return () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.pause();
        remoteVideoRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, [remoteStream, activeCall?.callType]);

  const handleEndCall = () => {
    endCall();
    if (onCallEnd) onCallEnd();
  };

  if (!activeCall) return null;

  const isVideo = activeCall.callType === 'video';

  return (

    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        // Fallback chain: 100dvh (mobile) → -webkit-fill-available (iOS Safari) → 100vh
        height: '100vh',
        bgcolor: '#000',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {isVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          // eslint-disable-next-line react/no-unknown-property
          webkit-playsinline="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
            display: remoteStream ? 'block' : 'none',
          }}
        />
      ) : (
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      )}

      {/* ── Avatar shown when no remote video yet ── */}
      {(!remoteStream || !isVideo) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Avatar
            src={activeCall.receiverAvatar}
            sx={{ width: 120, height: 120 }}
          />
          <Typography color="white" variant="h6">{activeCall.receiverName}</Typography>
          <Typography color="gray" variant="body2">{callStatus}</Typography>
          {!isVideo && (
            <Typography color="gray" variant="caption">Cuộc gọi thoại</Typography>
          )}
        </Box>
      )}

      {/* ── Header overlay (top) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          // Give extra room for mobile status bar
          pt: 'max(12px, env(safe-area-inset-top))',
        }}
      >
        <Avatar src={activeCall.receiverAvatar} alt={activeCall.receiverName} sx={{ width: 36, height: 36 }} />
        <Box>
          <Typography variant="subtitle1" color="white" lineHeight={1.2} fontWeight={600}>
            {activeCall.receiverName}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.7)">
            {callStatus}
          </Typography>
        </Box>
      </Box>

      {/* ── Local video PiP (top‑right) ── */}
      {isVideo && (
        <Box
          sx={{
            position: 'absolute',
            // Sit below the header
            top: 'calc(max(12px, env(safe-area-inset-top)) + 56px)',
            right: 16,
            width: { xs: 90, sm: 130 },
            height: { xs: 120, sm: 170 },
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#1a1a1a',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            display: localStream ? 'block' : 'none',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            // eslint-disable-next-line react/no-unknown-property
            webkit-playsinline="true"
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
          />
        </Box>
      )}

      {/* ── Controls overlay (bottom) ── */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          pb: 'max(24px, env(safe-area-inset-bottom))',
          pt: 3,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <IconButton
          onClick={handleEndCall}
          sx={{
            bgcolor: '#f44336',
            color: 'white',
            width: 64,
            height: 64,
            '&:hover': { bgcolor: '#d32f2f' },
          }}
        >
          <CallEnd />
        </IconButton>
      </Box>
    </Box>
  );
};

export default VideoCall;
