import _Notification from '../../models/notification';
import { ErrorApi } from '../../middleware/error';
import { Types } from 'mongoose';

export class NotificationControllerService {
    async getNotifications() {
        const listNotice = await _Notification.aggregate([
            {
                $facet: {
                    list: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 }
                    ],
                    totalUnread: [
                        { $match: { read: false } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        if (!listNotice) {
            throw new ErrorApi(404, "Not found notification");
        }

        return listNotice;
    }

    async markReadNotification(notificationId?: string, receiverId?: string) {
        const rs = notificationId
            ? await _Notification.updateMany({ _id: notificationId }, { read: true })
            : await _Notification.updateMany({ receiver: receiverId }, { read: true });

        if (!rs) {
            throw new ErrorApi(404, "Update status read failed");
        }

        return { success: true };
    }

    async getNotificationById(notificationId: string) {
        if (!notificationId) {
            throw new ErrorApi(400, "Notification ID is required");
        }

        const notice = await _Notification.findById(notificationId).lean();

        console.log (notice)

        if (!notice) {
            throw new ErrorApi(404, "Notification not found");
        }

        return notice;
    }

    async getNotificationsByReceiver(receiverId: string) {
        if (!receiverId || !Types.ObjectId.isValid(receiverId)) {
            throw new ErrorApi(400, "Invalid receiver ID");
        }

        const receiverObjId = new Types.ObjectId(receiverId);

        const listNotice = await _Notification.aggregate([
            { $match: { receiver: receiverObjId } },
            {
                $facet: {
                    list: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 }
                    ],
                    totalUnread: [
                        { $match: { read: false } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        if (!listNotice) {
            throw new ErrorApi(404, "Not found notification for receiver");
        }

        return listNotice;
    }
}

export default new NotificationControllerService();
