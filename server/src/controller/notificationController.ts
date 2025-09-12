import { json } from 'stream/consumers';
import { NextFunction, Response, Request } from "express";
import _Notification from "../models/notification";
import { equal } from "assert";
import { read } from "fs";
import message from '../models/message';

class notificationController {
    async getNotification(req: Request, res: Response, next: NextFunction) {

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
        ])

        if (!listNotice) {
            return res.status(404).json({
                message: "Not found notification"
            })
        }

        return res.status(200).json({
            message: "List success",
            result: listNotice
        })
    }

    async markedReadNotification(req: Request, res: Response, next: NextFunction) {

        const { notificationId, reciveId } = req.body

        const rs = notificationId ? await _Notification.updateMany({ _id: notificationId }, { read: true }) : await _Notification.updateMany({ receiver: reciveId }, { read: true })

        if (!rs) {
            return res.status(404).json({
                message: "Update status read faild"
            })
        }

        return res.status(200).json({
            message: "Update status success"
        })
    }
}

export default new notificationController()