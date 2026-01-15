
import { Message, MulticastMessage } from "firebase-admin/lib/messaging/messaging-api";
import { admin } from "../../databases/connectFirebase"
import { ObjectId, Types } from "mongoose";
import _User from '../../models/user'
import { INotification } from "../../models/notification";
import _Notifycation from '../../models/notification'

const sendNotifiCation = async (deviceToken: string, notice: INotification, title?: string) => {
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

        // Save notification to DB
        const noticee = await _Notifycation.create(notice)

        if (!noticee) {
            console.error('Failed to create notification in DB');
            return null;
        }

        // Send FCM notification
        const res = await admin.messaging().send(message)
        console.log('✅ Notification sent successfully:', res);
        return res;
    } catch (error: any) {
        console.error('❌ Error sending notification:', error.message);
        // Don't throw error, just return null to not break the flow
        return null;
    }
}

const sendEventDevice = async (notice: string, uid: string | ObjectId, title?: string) => {
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
const sendMessageNotification = async (
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
            console.log(`✅ Message notification sent to ${response.successCount} devices`);
        }

        return response;
    } catch (error: any) {
        console.error('❌ Error sending message notification:', error.message);
        return null;
    }
}

// Send notification to multiple users (for group chat)
const sendGroupMessageNotification = async (
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
            console.log(`✅ Group message notification sent to ${response.successCount}/${allTokens.length} devices`);
        }

        return response;
    } catch (error: any) {
        console.error('❌ Error sending group message notification:', error.message);
        return null;
    }
}

export { 
    sendNotifiCation, 
    sendEventDevice,
    sendMessageNotification,
    sendGroupMessageNotification
};