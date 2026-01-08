import express from 'express';
import {
    getCallById,
    getCallHistory,
    getCallsByConversation,
    deleteCallHistory,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    updateCallStatus
} from '../controller/callController';

const router = express.Router();

// Lấy lịch sử cuộc gọi của user hiện tại
router.get('/history', getCallHistory);

// Lấy lịch sử cuộc gọi theo conversation
router.get('/conversation/:conversationId', getCallsByConversation);

// Lấy thông tin cuộc gọi cụ thể
router.get('/:callId', getCallById);

// Xóa lịch sử cuộc gọi
router.delete('/:callId', deleteCallHistory);

// Bắt đầu cuộc gọi mới (REST endpoint - backup cho Socket.IO)
router.post('/initiate', initiateCall);

// Chấp nhận cuộc gọi
router.put('/:callId/accept', acceptCall);

// Từ chối cuộc gọi
router.put('/:callId/reject', rejectCall);

// Kết thúc cuộc gọi
router.put('/:callId/end', endCall);

// Cập nhật trạng thái cuộc gọi (admin/system)
router.put('/:callId/status', updateCallStatus);

export default router;
