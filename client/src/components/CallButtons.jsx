import React from 'react';
import { IconButton, Tooltip, Stack } from '@mui/material';
import { Call, Videocam } from '@mui/icons-material';
import { useVideoCall } from './util/VideoCallContext';

const CallButtons = ({ receiverId, receiverName, receiverAvatar, conversationId }) => {
  const { startCall, callStatus } = useVideoCall();

  const handleVideoCall = () => {

    console.log('🚩 handleVideoCall called');
    if (callStatus !== 'idle') {
      alert('Bạn đang trong cuộc gọi');
      return;
    }

    if (!conversationId) {
      alert('Không tìm thấy conversation ID');
      return;
    }

    console.log('📞 Bắt đầu cuộc gọi video:', { receiverId, conversationId });
    startCall(receiverId, receiverName, receiverAvatar, conversationId, 'video');
  };

  const handleAudioCall = () => {
    console.log('🚩 handleAudioCall called');
    if (callStatus !== 'idle') {
      alert('Bạn đang trong cuộc gọi');
      return;
    }

    if (!conversationId) {
      alert('Không tìm thấy conversation ID');
      return;
    }
    startCall(receiverId, receiverName, receiverAvatar, conversationId, 'audio');
  };

  return (
    <Stack direction="row" spacing={1}>
      {/* Nút gọi thoại */}
      <Tooltip title="Gọi thoại">
        <IconButton
          onClick={handleAudioCall}
          disabled={callStatus !== 'idle'}
          sx={{
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.light',
            },
          }}
        >
          <Call />
        </IconButton>
      </Tooltip>

      {/* Nút gọi video */}
      <Tooltip title="Gọi video">
        <IconButton
          onClick={handleVideoCall}
          disabled={callStatus !== 'idle'}
          sx={{
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.light',
            },
          }}
        >
          <Videocam />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default CallButtons;
