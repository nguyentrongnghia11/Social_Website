import React, { useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Stack,
  Avatar,
} from '@mui/material';
import {
  CallEnd,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';
import { useVideoCall } from './util/VideoCallContext';

const VideoCall = ({ onCallEnd }) => {
  const {
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    endCall,
    toggleMute,
    toggleVideo,
  } = useVideoCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Set local video stream
  useEffect(() => {
    console.log('🎥 [VideoCall] Local stream effect:', { 
      hasStream: !!localStream, 
      hasRef: !!localVideoRef.current, 
      callType: activeCall?.callType, 
      isVideoOff 
    });
    if (localStream && localVideoRef.current && activeCall?.callType === 'video' && !isVideoOff) {
      console.log('✅ Setting local video srcObject');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.callType, isVideoOff]);

  // Set remote stream
  useEffect(() => {
    console.log('📺 [VideoCall] Remote stream effect:', { 
      hasRemoteStream: !!remoteStream, 
      callType: activeCall?.callType,
      hasVideoRef: !!remoteVideoRef.current,
      hasAudioRef: !!remoteAudioRef.current,
      remoteStreamTracks: remoteStream?.getTracks().map(t => `${t.kind}:${t.enabled}`)
    });
    
    if (!remoteStream) return;

    if (activeCall?.callType === 'video' && remoteVideoRef.current) {
      console.log('✅ Setting remote video srcObject');
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => console.error('❌ Play error:', err));
    } else if (activeCall?.callType === 'audio' && remoteAudioRef.current) {
      console.log('✅ Setting remote audio srcObject');
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(err => console.error('❌ Play error:', err));
    }
  }, [remoteStream, activeCall?.callType]);

  const handleEndCall = () => {
    endCall();
    if (onCallEnd) {
      onCallEnd();
    }
  };

  if (!activeCall) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: '#1a1a1a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar src={activeCall.receiverAvatar} alt={activeCall.receiverName} />
        <Box>
          <Typography variant="h6" color="white">
            {activeCall.receiverName}
          </Typography>
          <Typography variant="caption" color="gray">
            {callStatus}
          </Typography>
        </Box>
      </Box>

      {/* Video containers */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Remote video (full screen) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#000',
          }}
        >
          {remoteStream && activeCall.callType === 'video' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={activeCall.receiverAvatar}
                sx={{ width: 120, height: 120, margin: '0 auto', mb: 2 }}
              />
              <Typography color="white" variant="h6">
                {activeCall.receiverName}
              </Typography>
              <Typography color="gray" variant="body2">
                {callStatus}
              </Typography>
              {activeCall.callType === 'audio' && (
                <Typography color="gray" variant="caption" sx={{ mt: 2, display: 'block' }}>
                  Cuộc gọi thoại
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Local video (picture-in-picture) */}
        {activeCall.callType === 'video' && localStream && !isVideoOff && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 80,
              right: 16,
              width: 150,
              height: 200,
              overflow: 'hidden',
              borderRadius: 2,
              bgcolor: '#000',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror effect
              }}
            />
          </Paper>
        )}

        {/* Hidden audio element for audio calls */}
        {activeCall.callType === 'audio' && (
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
        )}
      </Box>

      {/* Controls */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2}>
          {/* Mute button */}
          <IconButton
            onClick={toggleMute}
            sx={{
              bgcolor: isMuted ? '#f44336' : 'rgba(255,255,255,0.2)',
              color: 'white',
              width: 56,
              height: 56,
              '&:hover': {
                bgcolor: isMuted ? '#d32f2f' : 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </IconButton>

          {/* End call button */}
          <IconButton
            onClick={handleEndCall}
            sx={{
              bgcolor: '#f44336',
              color: 'white',
              width: 64,
              height: 64,
              '&:hover': {
                bgcolor: '#d32f2f',
              },
            }}
          >
            <CallEnd />
          </IconButton>

          {/* Video toggle button */}
          {activeCall.callType === 'video' && (
            <IconButton
              onClick={toggleVideo}
              sx={{
                bgcolor: isVideoOff ? '#f44336' : 'rgba(255,255,255,0.2)',
                color: 'white',
                width: 56,
                height: 56,
                '&:hover': {
                  bgcolor: isVideoOff ? '#d32f2f' : 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {isVideoOff ? <VideocamOff /> : <Videocam />}
            </IconButton>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default VideoCall;
