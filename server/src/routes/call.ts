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

router.get('/history', getCallHistory);
router.get('/conversation/:conversationId', getCallsByConversation);
router.get('/:callId', getCallById);
router.delete('/:callId', deleteCallHistory);
router.post('/initiate', initiateCall);
router.put('/:callId/accept', acceptCall);
router.put('/:callId/reject', rejectCall);
router.put('/:callId/end', endCall);
router.put('/:callId/status', updateCallStatus);

export default router;
