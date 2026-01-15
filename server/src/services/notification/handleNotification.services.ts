import redisClient from "../../databases/connectRedis";
import _Notification, { INotification } from "../../models/notification";
import { sendEventDevice } from "./notification.services";
import { io } from "../..";
import _User from "../../models/user";

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

        const list = await redisClient.sMembers(`${keyUserOnline}${notif.receiver}`);
        console.log(`🔔 Emitting ${notif.type} notification to ${list.length} socket(s)`);
        
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

            // Send FCM push notification with proper title
            const response = await sendEventDevice(
                notif.message,
                notif.receiver,
                notif.title || getNotificationTitle(notif.type)
            );
            
            console.log(response 
                ? `✅ Push notification sent for ${notif.type}` 
                : '❌ Push notification failed'
            );
        } else {
            console.log(`ℹ️ User online, skipping push notification for ${notif.type}`);
        }
    } catch (error: any) {
        console.error('❌ Error in handleNotification:', error.message);
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
