import redisClient from "../../databases/connectRedis";
import _Notification, { INotification } from "../../models/notification";
import { io } from "../..";
import _User from "../../models/user";
import { ErrorApi } from "../../middleware/error";
import { Message, MulticastMessage } from "firebase-admin/lib/messaging/messaging-api";
import { admin } from "../../databases/connectFirebase"
import { ObjectId, Types } from "mongoose";
import _Notifycation from '../../models/notification'

export async function handleNotification(notice: INotification) {
    const keyUserOnline = "USER-ONLINE-SOCKET-";

    try {
        const notif = await _Notification.create(notice);
        if (!notif) {
            console.error('Failed to create notification');
            return;
        }

        // Populate notification with sender info before emitting
        const populatedNotif = await _Notification.findById(notif._id)
            .populate('sender', 'name avatar')
            .lean();

        console.log ("Populated notif ", populatedNotif)

        const list = await redisClient.sMembers(`${keyUserOnline}${notif.receiver}`);
        for (const socketId of list) {
            io.to(socketId).emit(notif.type, populatedNotif || notif);
            console.log(`✅ Emitted to socket: ${socketId}`);
        }

        const isOnline = list.length > 0;

        if (!isOnline) {
            let senderName = 'Someone';
            if (notice.sender) {
                const sender = await _User.findById(notice.sender).select('name').lean();
                senderName = sender?.name || 'Someone';
            }
            const response = await sendEventDevice(
                notif.message,
                notif.receiver,
                notif.title || getNotificationTitle(notif.type)
            );

            console.log(response
                ? `Push notification sent for ${notif.type}`
                : 'offline failed'
            );
        } 
    } catch (error: any) {
        console.error('Error in handleNotification:', error.message);
    }
}


export const getNotifications = async () => {
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

export const markReadNotification = async (notificationId?: string, receiverId?: string) => {
    const rs = notificationId
        ? await _Notification.updateMany({ _id: notificationId }, { read: true })
        : await _Notification.updateMany({ receiver: receiverId }, { read: true });

    if (!rs) {
        throw new ErrorApi(404, "Update status read failed");
    }

    return { success: true };
}

export const getNotificationById = async (notificationId: string) => {
    if (!notificationId) {
        throw new ErrorApi(400, "Notification ID is required");
    }

    const notice = await _Notification.findById(notificationId).lean();

    console.log(notice)

    if (!notice) {
        throw new ErrorApi(404, "Notification not found");
    }

    return notice;
}

export const getNotificationsByReceiver = async (receiverId: string) => {
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



// firebase
export const sendNotifiCation = async (deviceToken: string, notice: INotification, title?: string) => {
    try {
        const message: Message = {
            token: deviceToken,
            notification: {
                title: title || 'Thông báo mới',
                body: notice.message
            },
            data: {
                type: notice.type || 'general',
                ...(notice.link && { link: notice.link })
            }
        }
        const noticee = await _Notifycation.create(notice)

        if (!noticee) {
            console.error('Failed to create notification in DB');
            return null;
        }
        const res = await admin.messaging().send(message)
        console.log('✅ Notification sent successfully:', res);
        return res;
    } catch (error: any) {
        console.error('❌ Error sending notification:', error.message);
        // Don't throw error, just return null to not break the flow
        return null;
    }
}

export const sendEventDevice = async (notice: string, uid: string | ObjectId, title?: string) => {
    try {
        const user = await _User.findById(uid).select({ tokenFcms: 1 }).lean();

        const tokenFcms: string[] | null = user && user.tokenFcms ? user.tokenFcms : null;

        if (!tokenFcms || tokenFcms.length === 0) {
            console.log('No FCM tokens found for user:', uid);
            return null;
        }

        const message: MulticastMessage = {
            tokens: tokenFcms,
            notification: {
                title: title || 'Thông báo mới',
                body: notice
            }
        }

        const response = await admin.messaging().sendEachForMulticast(message)

        if (!response) {
            return null
        }

        console.log(`✅ Sent notification to ${response.successCount}/${tokenFcms.length} devices`);

        // Log failed tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokenFcms[idx]);
                }
            });
            console.log('❌ Failed tokens:', failedTokens);
        }

        return response;
    } catch (error: any) {
        console.error('❌ Error sending multicast notification:', error.message);
        return null;
    }
}

// Send notification for new message
export const sendMessageNotification = async (
    recipientId: string | ObjectId,
    senderName: string,
    messageContent: string,
    conversationId: string
) => {
    try {
        const user = await _User.findById(recipientId).select({ tokenFcms: 1 }).lean();

        if (!user || !user.tokenFcms || user.tokenFcms.length === 0) {
            return null;
        }

        const title = `Tin nhắn mới từ ${senderName}`;
        const body = messageContent.length > 100
            ? messageContent.substring(0, 100) + '...'
            : messageContent;

        const message: MulticastMessage = {
            tokens: user.tokenFcms,
            notification: {
                title,
                body
            },
            data: {
                type: 'message',
                conversationId,
                senderName
            }
        }

        const response = await admin.messaging().sendEachForMulticast(message);

        if (response) {
            console.log(`Message notification sent to ${response.successCount} devices`);
        }

        return response;
    } catch (error: any) {
        console.error('Error sending message notification:', error.message);
        return null;
    }
}

// Send notification to multiple users (for group chat)
export const sendGroupMessageNotification = async (
    recipientIds: (string | ObjectId)[],
    senderName: string,
    messageContent: string,
    groupName: string,
    conversationId: string
) => {
    try {
        const users = await _User.find({
            _id: { $in: recipientIds.map(id => new Types.ObjectId(id.toString())) }
        }).select({ tokenFcms: 1 }).lean();

        const allTokens: string[] = [];
        users.forEach(user => {
            if (user.tokenFcms && user.tokenFcms.length > 0) {
                allTokens.push(...user.tokenFcms);
            }
        });

        if (allTokens.length === 0) {
            return null;
        }

        const title = `${senderName} trong ${groupName}`;
        const body = messageContent.length > 100
            ? messageContent.substring(0, 100) + '...'
            : messageContent;

        const message: MulticastMessage = {
            tokens: allTokens,
            notification: {
                title,
                body
            },
            data: {
                type: 'group_message',
                conversationId,
                groupName,
                senderName
            }
        }

        const response = await admin.messaging().sendEachForMulticast(message);

        if (response) {
            console.log(`Group message notification sent to ${response.successCount}/${allTokens.length} devices`);
        }

        return response;
    } catch (error: any) {
        console.error('Error sending group message notification:', error.message);
        return null;
    }
}

function getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
        'follow': 'Người theo dõi mới',
        'like': 'Lượt thích mới',
        'comment': 'Bình luận mới',
        'message': 'Tin nhắn mới',
        'invite': 'Lời mời mới',
        'login': 'Đăng nhập',
    };
    return titles[type] || 'Thông báo mới';
}
