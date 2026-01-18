import { Router } from 'express'
import notificationController from '../controller/notificationController';
import { validateMarkedReadNotification } from '../validations/validation';
import { authenticateMiddleware } from '../middleware/verifyToken';

const router = Router();

router.get('/all', notificationController.getNotification)
router.patch('/mark-as-read',validateMarkedReadNotification ,notificationController.markedReadNotification)
router.patch('/mark-all-as-read', authenticateMiddleware, notificationController.markAllAsRead)
router.get('/user/:id', authenticateMiddleware, notificationController.getNotificationsForUser)
router.get('/:id', authenticateMiddleware, notificationController.getNotificationById)


export default router

