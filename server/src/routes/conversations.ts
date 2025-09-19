import { Router } from 'express';
import { getAllConventionOfUser, getMessageOfUser } from "../controller/messageController";
import { authenticateMiddleware } from '../middleware/verifyToken';

const router = Router();

router.get('/all', authenticateMiddleware, getAllConventionOfUser)
router.get('/:id', authenticateMiddleware, getMessageOfUser)



export default router