import { getMessaging, getToken } from "firebase/messaging";
import { messaging } from "./initFireBase";

export async function requestPermission() {
    // Check if messaging is available
    if (!messaging) {
        console.log('Firebase Messaging not available, skipping permission request');
        return null;
    }

    console.log('Requesting permission...');

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted. ');
            const currentToken = await getToken(messaging, {
                vapidKey: 'BO9gp-iucYOdQTJMp5Us6Z8zlsewNWCPG1fhIc7P9eQ2b8YLRJ2On967ORH46MzTMq5YoDhxALXpUgLvMW3dAVo'
            });

            console.log('Current token:', currentToken);

            if (currentToken) {
                return currentToken;
            }
            return null;
        }
    } catch (error) {
        console.warn('⚠️ Failed to get notification token:', error.message);
        return null;
    }
}



export const subscribeForemessage = () => {
    // onMessage(messaging, (payload) => {
    //     console.log('Thông báo foreground nhận được:', payload);
    //     // Bạn có thể hiển thị bằng toast, modal, alert...
    //     alert(`Tin nhắn: ${payload.notification?.title}`);
    // })
}

