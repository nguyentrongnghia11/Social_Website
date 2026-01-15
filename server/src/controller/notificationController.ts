import { NextFunction, Response, Request } from "express";
import { getNotifications, getNotificationById, getNotificationsByReceiver, markReadNotification } from "../services/notification/notification.services";
// import notificationControllerService from "../services/notification/notificationController.services";

class NotificationController {
    async getNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const listNotice = await getNotifications();

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

            await markReadNotification(notificationId, reciveId);

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

            console.log(id)

            const notice = await getNotificationById(id);

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

            const result = await getNotificationsByReceiver(id);

            console.log(result)
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
