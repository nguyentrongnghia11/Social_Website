import { Router } from 'express';
import { getAllConventionOfUser, getMessageOfUser, markMessagesAsRead } from "../controller/messageController";
import { authenticateMiddleware } from '../middleware/verifyToken';

const router = Router();

router.get('/all', authenticateMiddleware, getAllConventionOfUser)
router.get('/:id', authenticateMiddleware, getMessageOfUser)
router.patch('/:id/read', authenticateMiddleware, markMessagesAsRead)



export default router