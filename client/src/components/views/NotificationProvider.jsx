import React, { createContext, useContext, useEffect, useRef } from "react";
import { Snackbar, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from '@mui/icons-material'
import { onEvent, offEvent, initiateSocketConnection, socket } from "../../helpers/socketHelper";
import { isLoggedIn } from "../../helpers/authHelper";
import { getNotifications } from "../../api-axios/notification";
import useNotificationStore from "../../stores/useNotificationStore";
import { subscribeForemessage } from "../../helpers/messaging_getToken";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const navigate = useNavigate();
    const notificationListenersRegistered = useRef(false);
    
    const notifications = useNotificationStore((state) => state.notifications);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const snackbar = useNotificationStore((state) => state.snackbar);

    const handleClose = (event, reason) => {
        if (reason === "clickaway") return;
        useNotificationStore.getState().hideSnackbar();
        useNotificationStore.getState().clearSnackbarLink();
    };

    const handleGo = () => {
        const { snackbar } = useNotificationStore.getState();
        if (snackbar.link) navigate(snackbar.link);
        useNotificationStore.getState().hideSnackbar();
        useNotificationStore.getState().clearSnackbarLink();
    };

    useEffect(() => {
        const user = isLoggedIn();
        if (!user || notificationListenersRegistered.current) {
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
                    console.log("notificationData ", Number(notificationData?.totalUnread?.[0]?.count) || 0);
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
        
        notificationListenersRegistered.current = true;

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
            
            notificationListenersRegistered.current = false;
        }
    }, [])


    return (
        <NotificationContext.Provider value={{ 
            showNotification: (...args) => useNotificationStore.getState().showSnackbar(...args),
            notifications, 
            unreadCount, 
            addNotification: (...args) => useNotificationStore.getState().addNotification(...args),
            markAsRead: (...args) => useNotificationStore.getState().markAsRead(...args),
            markAllAsRead: () => useNotificationStore.getState().markAllAsRead()
        }}>
            {children}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={8000}
                onClose={handleClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                disableWindowBlurListener
                sx={{
                    right: '24px !important',
                    left: 'auto !important',
                    top: '50vh !important',
                }}
            >
                <Alert
                    severity="success"
                    icon={<CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />}
                    action={
                        snackbar.link && (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={handleGo}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    px: 2,
                                    py: 0.5,
                                    minWidth: 'auto',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: '#059669',
                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                    }
                                }}
                            >
                                VIEW
                            </Button>
                        )
                    }
                    sx={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        minWidth: '320px',
                        '& .MuiAlert-message': {
                            fontWeight: 500,
                            fontSize: '14px'
                        }
                    }}
                >
                    {snackbar.message || "Posted successfully"}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
