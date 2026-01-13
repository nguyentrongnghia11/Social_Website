import React from 'react';
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
    </Dialog>
  );
};

export default IncomingCallModal;
