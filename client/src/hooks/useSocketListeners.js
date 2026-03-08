import { useEffect, useRef } from 'react';
import { onEvent, offEvent, initiateSocketConnection } from '../helpers/socketHelper';
import { isLoggedIn } from '../helpers/authHelper';
import { getNotifications } from '../api-axios/notification';
import { subscribeForemessage } from '../helpers/messaging_getToken';
import useNotificationStore from '../stores/useNotificationStore';


export const useSocketListeners = () => {
    const listenersRegistered = useRef(false);
    const authTrigger = useNotificationStore((state) => state.authTrigger);

    useEffect(() => {
        const user = isLoggedIn();
        if (!user) {
            listenersRegistered.current = false;
            return;
        }
        
        if (listenersRegistered.current) {
            return;
        }

        const socket = initiateSocketConnection();
        if (!socket) {
            console.warn('Failed to initialize socket connection');
            return;
        }

        (async () => {
            try {
                const resp = await getNotifications();
                const payload = resp.data?.data;
                if (Array.isArray(payload) && payload.length > 0) {
                    const notificationData = payload[0];
                    useNotificationStore.getState().setNotifications(notificationData.list || []);
                }
            } catch (err) {
                console.error('Failed to load initial notifications', err);
            }
        })();

        const handleDisplayStatusUploadPost = (content) => {
            if (content) {
                useNotificationStore.getState().showSnackbar({ 
                    message: "Posted successfully!", 
                    link: `/posts/${content.postId}` 
                });
            }
        };

        const handleLikeNotification = (notification) => {
            useNotificationStore.getState().addNotification(notification);
            useNotificationStore.getState().showSnackbar({
                message: notification.message || "Someone liked your post",
                link: notification.link
            });
        };

        const handleFollowNotification = (notification) => {
            useNotificationStore.getState().addNotification(notification);
            useNotificationStore.getState().showSnackbar({
                message: notification.message || "You have a new follower",
                link: notification.link
            });
        };

        const handleCommentNotification = (notification) => {
            useNotificationStore.getState().addNotification(notification);
            useNotificationStore.getState().showSnackbar({
                message: notification.message || "New comment on your post",
                link: notification.link
            });
        };

        const handleMessageNotification = (notification) => {
            useNotificationStore.getState().addNotification(notification);
            useNotificationStore.getState().showSnackbar({
                message: notification.message || "You have a new message",
                link: notification.link
            });
        };

        const handleInviteNotification = (notification) => {
            useNotificationStore.getState().addNotification(notification);
            useNotificationStore.getState().showSnackbar({
                message: notification.message || "You have a new invitation",
                link: notification.link
            });
        };

        const handleLoginNotification = (notification) => {
            useNotificationStore.getState().addNotification(notification);
            useNotificationStore.getState().showSnackbar({
                message: notification.message || "New login detected",
                link: null
            });
        };

        // Message socket handlers
        const currentUserId = user?.user?._id || user?._id;

        const handleNewMessage = (data) => {
            const senderId = data?.msg?.senderId?._id || data?.msg?.senderId;
            if (senderId !== currentUserId) {
                useNotificationStore.getState().incrementUnreadMsgCount();
            }
        };

        const handleMessageRead = () => {
            useNotificationStore.getState().decrementUnreadMsgCount();
        };

        const handleAllMessagesRead = () => {
            useNotificationStore.getState().resetUnreadMsgCount();
        };

        // Subscribe to Firebase Cloud Messaging
        subscribeForemessage();

        // Register socket event listeners
        onEvent("post:uploaded", handleDisplayStatusUploadPost);
        onEvent("like", handleLikeNotification);
        onEvent("follow", handleFollowNotification);
        onEvent("comment", handleCommentNotification);
        onEvent("message", handleMessageNotification);
        onEvent("invite", handleInviteNotification);
        onEvent("login", handleLoginNotification);
        
        // Message count listeners
        onEvent('chat', handleNewMessage);
        onEvent('message:read', handleMessageRead);
        onEvent('messages:all-read', handleAllMessagesRead);
        
        listenersRegistered.current = true;

        return () => {
            offEvent("post:uploaded", handleDisplayStatusUploadPost);
            offEvent("like", handleLikeNotification);
            offEvent("follow", handleFollowNotification);
            offEvent("comment", handleCommentNotification);
            offEvent("message", handleMessageNotification);
            offEvent("invite", handleInviteNotification);
            offEvent("login", handleLoginNotification);
            
            // Cleanup message listeners
            offEvent('chat', handleNewMessage);
            offEvent('message:read', handleMessageRead);
            offEvent('messages:all-read', handleAllMessagesRead);
            
            listenersRegistered.current = false;
        };
    }, [authTrigger]);
};
