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
          console.log('Setting local video srcObject');
          try {
            localVideoRef.current.srcObject = localStream;
            await localVideoRef.current.play();
            // console.log('Local video playing');
            return;
          } catch (err) {
            console.warn('Local video autoplay blocked:', err.message);
            return; // Not critical for local video
          }
        }        
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }
      
      console.error('Failed to get local video ref after retries');
    };
    
    setupLocalVideo();

    // Cleanup
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
          // console.log('Setting remote video srcObject');
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
          console.log('Setting remote audio srcObject');
          remoteAudioRef.current.srcObject = remoteStream;
          
          try {
            await remoteAudioRef.current.play();
            console.log('Remote audio playing');
          } catch (err) {
            console.error('Remote audio play error:', err);
          }
          return;
        }
        console.log('Waiting for video ref...', retries);
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }
      
      console.error('Failed to get video ref after retries');
    };

    setupRemoteMedia();

    // Cleanup
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
          {/* Remote video - always render but hide when no stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            webkit-playsinline="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
              display: (remoteStream && activeCall.callType === 'video') ? 'block' : 'none',
            }}
          />
          
          {/* Show avatar when no video */}
          {(!remoteStream || activeCall.callType === 'audio') && (
            <Box sx={{ textAlign: 'center', position: 'absolute' }}>
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

        {/* Local video (picture-in-picture) - always render for video calls */}
        {activeCall.callType === 'video' && (
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
              display: localStream ? 'block' : 'none',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
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
        {/* End call button only */}
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
      </Box>
    </Box>
  );
};

export default VideoCall;
