import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Box,
  Stack,
  IconButton,
} from '@mui/material';
import { Call, CallEnd, Videocam } from '@mui/icons-material';
import { useVideoCall } from './util/VideoCallContext';

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useVideoCall();
  const audioRef = useRef(null);

  // Play ringtone when call comes in
  useEffect(() => {
    if (incomingCall) {
      // Try to play system notification sound
      try {
        if (audioRef.current) {
          audioRef.current.play().catch(err => {
            console.warn('⚠️ Cannot play ringtone:', err);
          });
        }
      } catch (error) {
        console.error('❌ Error playing ringtone:', error);
      }

      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Cuộc gọi đến', {
          body: `${incomingCall.callerName} đang gọi ${incomingCall.callType === 'video' ? 'video' : 'thoại'}`,
          icon: incomingCall.callerAvatar || '/default-avatar.png',
          tag: 'incoming-call',
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } else {
      // Stop ringtone when call is dismissed
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const { callerName, callerAvatar, callType } = incomingCall;

  return (
    <Dialog
      open={!!incomingCall}
      onClose={rejectCall}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 3,
          overflow: 'visible',
        },
      }}
    >
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {/* Avatar với animation */}
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 3,
            }}
          >
            <Avatar
              src={callerAvatar}
              alt={callerName}
              sx={{
                width: 100,
                height: 100,
                margin: '0 auto',
                border: '4px solid',
                borderColor: 'primary.main',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 20px rgba(25, 118, 210, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
                  },
                },
              }}
            />
            {/* Icon loại cuộc gọi */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                p: 1,
                color: 'white',
              }}
            >
              {callType === 'video' ? (
                <Videocam fontSize="small" />
              ) : (
                <Call fontSize="small" />
              )}
            </Box>
          </Box>

          {/* Tên người gọi */}
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {callerName}
          </Typography>

          {/* Loại cuộc gọi */}
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {callType === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
          </Typography>

          {/* Animation text */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: 2,
              animation: 'blink 1.5s linear infinite',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          >
            Đang gọi...
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        {/* Nút từ chối */}
        <IconButton
          onClick={rejectCall}
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
          <CallEnd fontSize="large" />
        </IconButton>

        {/* Nút chấp nhận */}
        <IconButton
          onClick={acceptCall}
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
            width: 64,
            height: 64,
            '&:hover': {
              bgcolor: '#388e3c',
            },
          }}
        >
          {callType === 'video' ? (
            <Videocam fontSize="large" />
          ) : (
            <Call fontSize="large" />
          )}
        </IconButton>
      </DialogActions>

      {/* Hidden audio element for ringtone */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        {/* Use a data URL for a simple beep sound */}
        <source 
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVKzn7bNiHAg7k9n0z4AuBSZ7y/DbkUELF2G56+yhVhQNSqLi8b9vJAU0iNL0zYI2Bh9ywO/cnVEOEFat5+2yYhwIO5PZ9M+ALgUnfMzw25FAChVhu+rsoVYUDUql4vG+byQFNonS9M2CNgYfccDu3J1RDhBWrefts2IcCDuU2fTQgC4FJ3zM8NuRQAoVYbvq7KFWEw1KpeHxvm8kBTaK0vTNgjYGH3HA7tydUQ4QVq3n7bNiHAg7lNn0z4AuBSd8zPDbkUAKFWG76uyhVhMNSqXh8b5vJAU2itL0zYI2Bh9xwO7cnVEOEFat5+2zYhwIO5TZ9M+ALgUnfMzw25FAChVhu+rsoVYTDUql4fG+byQFNorS9M2CNgYfccDu3J1RDhBWrefts2IcCDuU2fTQgC4FJ3zM8NuRQAoVYbvq7KFWEw1KpeHxvm8kBTaK0vTNgjYGH3HA7tydUQ4QVq3n7bNiHAg7lNn0z4AuBSd8zPDbkUAKFWG76uyhVhMNSqXh8b5vJAU2itL0zYI2Bh9xwO7cnVEOEFat5+2zYhwIO5TZ9M+ALgUnfMzw25FAChVhu+rsoVYTDUql4fG+byQFNorS9M2CNgYfccDu3J1RDhBWrefts2IcCDuU2fTQgC4FJ3zM8NuRQAoVYbvq7KFWEw1KpeHxvm8kBTaK0vTNgjYGH3HA7tydUQ4QVq3n7bNiHAg7lNn0z4AuBSd8zPDbkUAKFWG76uyhVhMNSqXh8b5vJAU2itL0zYI2Bh9xwO7cnVEOEFat5+2zYhwIO5TZ9M+ALgUnfMzw25FAChVhu+rsoVYTDUql4fG+byQFNorS9M2CNgYfccDu3J1RDhBWrefts2IcCDuU2fTPgC4FJ3zM8NuRQAoVYbvq7KFWEw1KpeHxvm8kBTaK0vTNgjYGH3HA7tydUQ4="
          type="audio/wav"
        />
      </audio>
    </Dialog>
  );
};

export default IncomingCallModal;
