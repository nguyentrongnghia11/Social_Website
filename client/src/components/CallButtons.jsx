import React from 'react';
import { IconButton, Tooltip, Stack } from '@mui/material';
import { Call, Videocam } from '@mui/icons-material';
import { useVideoCall } from './util/VideoCallContext';

const CallButtons = ({ receiverId, receiverName, receiverAvatar, conversationId }) => {
  const { startCall, callStatus } = useVideoCall();

  const handleVideoCall = async () => {
    console.log('🚩 handleVideoCall called');
    
    if (callStatus !== 'idle') {
      alert('Bạn đang trong cuộc gọi');
      return;
    }

    if (!conversationId) {
      alert('Không tìm thấy conversation ID');
      return;
    }

    // Check for camera/mic permissions before starting call
    try {
      console.log('🔐 Checking camera/mic permissions...');
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('✅ Permissions granted');
    } catch (error) {
      console.error('❌ Permission denied:', error);
      const errorMessage = error.name === 'NotAllowedError'
        ? 'Bạn cần cấp quyền truy cập camera và microphone để thực hiện cuộc gọi video'
        : error.name === 'NotFoundError'
        ? 'Không tìm thấy camera hoặc microphone'
        : 'Không thể truy cập camera/microphone';
      alert(errorMessage);
      return;
    }

    console.log('📞 Bắt đầu cuộc gọi video:', { receiverId, conversationId });
    startCall(receiverId, receiverName, receiverAvatar, conversationId, 'video');
  };

  const handleAudioCall = async () => {
    console.log('🚩 handleAudioCall called');
    
    if (callStatus !== 'idle') {
      alert('Bạn đang trong cuộc gọi');
      return;
    }

    if (!conversationId) {
      alert('Không tìm thấy conversation ID');
      return;
    }

    // Check for mic permission before starting call
    try {
      console.log('🔐 Checking mic permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Permission granted');
    } catch (error) {
      console.error('❌ Permission denied:', error);
      alert('Bạn cần cấp quyền truy cập microphone để thực hiện cuộc gọi thoại');
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
