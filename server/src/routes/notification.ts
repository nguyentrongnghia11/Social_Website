import { Router } from 'express'
import notificationController from '../controller/notificationController';
import { validateMarkedReadNotification } from '../validations/validation';

const router = Router();

router.get('/all', notificationController.getNotification)
router.patch('/mark-as-read',validateMarkedReadNotification ,notificationController.markedReadNotification)


export default router

