import { NextFunction, Response, Request } from "express";
import notificationControllerService from "../services/notification/notificationController.services";

class NotificationController {
    async getNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const listNotice = await notificationControllerService.getNotifications();

            return res.status(200).json({
                message: "List success",
                result: listNotice
            });
        } catch (error) {
            next(error);
        }
    }

    async markedReadNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const { notificationId, reciveId } = req.body;

            await notificationControllerService.markReadNotification(notificationId, reciveId);

            return res.status(200).json({
                message: "Update status success"
            });
        } catch (error) {
            next(error);
        }
    }

    async getNotificationById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;

            console.log (id)

            const notice = await notificationControllerService.getNotificationById(id);

            return res.status(200).json({
                message: 'Get notification success',
                data: notice
            });
        } catch (error) {
            next(error);
        }
    }

    async getNotificationsForUser(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;

            const result = await notificationControllerService.getNotificationsByReceiver(id);

            console.log (result)
            return res.status(200).json({
                message: 'Get notifications for user success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new NotificationController();
