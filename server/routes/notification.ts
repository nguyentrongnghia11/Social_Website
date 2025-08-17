import { Router } from 'express'
import notificationController from '../controller/notificationController';

const router = Router();

router.get('/all', notificationController.getNotification)
router.patch('/mark-as-read', notificationController.markedReadNotification)


export default router

