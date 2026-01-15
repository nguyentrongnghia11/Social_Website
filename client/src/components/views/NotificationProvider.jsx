import React, { createContext, useContext, useState, useEffect } from "react";
import { Snackbar, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from '@mui/icons-material'
import { onEvent, offEvent, initiateSocketConnection, socket } from "../../helpers/socketHelper";
import { isLoggedIn } from "../../helpers/authHelper";
import { getNotifications, markAsRead as markAsReadAPI } from "../../api-axios/notification";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const showNotification = ({ message = "Posted successfully", link = "123" }) => {
        setMessage(message);
        setLink(link);
        setOpen(true);
        try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
            });
        } catch (error) {
        }
    };

    const handleClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
        setLink(null);
    };

    const handleGo = () => {
        if (link) navigate(link);
        setOpen(false);
        setLink(null);
    };

    const handleDisplayStatusUploadPost = (content) => {
        if (content) {
            showNotification({ message: "Posted successfully!", link: `/posts/${content.postId}` })
        }
    }

    const addNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
        if (!notification.read) setUnreadCount((prev) => prev + 1);
    };

    const markAsRead = async (notificationId) => {
        try {
            const user = isLoggedIn();
            const reciveId = user?.user?._id || user?._id;

            await markAsReadAPI(notificationId, reciveId);

            setNotifications((prev) => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleLikeNotification = (notification) => {
        addNotification(notification);
        showNotification({
            message: notification.message || "Someone liked your post",
            link: notification.link
        });
    };

    const handleFollowNotification = (notification) => {
        addNotification(notification);
        showNotification({
            message: notification.message || "You have a new follower",
            link: notification.link
        });
    };

    const handleCommentNotification = (notification) => {
        addNotification(notification);
        showNotification({
            message: notification.message || "New comment on your post",
            link: notification.link
        });
    };

    const handleMessageNotification = (notification) => {
        addNotification(notification);
        showNotification({
            message: notification.message || "You have a new message",
            link: notification.link
        });
    };

    const handleInviteNotification = (notification) => {
        addNotification(notification);
        showNotification({
            message: notification.message || "You have a new invitation",
            link: notification.link
        });
    };

    const handleLoginNotification = (notification) => {
        addNotification(notification);
        showNotification({
            message: notification.message || "New login detected",
            link: null
        });
    };

    useEffect(() => {
        const user = isLoggedIn();
        if (!user) {
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
                    setNotifications(notificationData.list || []);
                    console.log("notificationData ", Number(notificationData?.totalUnread?.[0]?.count) || 0);
                    setUnreadCount(Number(notificationData?.totalUnread?.[0]?.count) || 0);
                }
            } catch (err) {
                console.error('Failed to load initial notifications', err);
            }
        })();

        onEvent("post:uploaded", handleDisplayStatusUploadPost);
        onEvent("like", handleLikeNotification);
        onEvent("follow", handleFollowNotification);
        onEvent("comment", handleCommentNotification);
        onEvent("message", handleMessageNotification);
        onEvent("invite", handleInviteNotification);
        onEvent("login", handleLoginNotification);

        return () => {
            offEvent("post:uploaded", handleDisplayStatusUploadPost);
            offEvent("like", handleLikeNotification);
            offEvent("follow", handleFollowNotification);
            offEvent("comment", handleCommentNotification);
            offEvent("message", handleMessageNotification);
            offEvent("invite", handleInviteNotification);
            offEvent("login", handleLoginNotification);
        }
    }, [socket])


    return (
        <NotificationContext.Provider value={{ showNotification, notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={5000}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
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
                        link && (
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
                    {message || "Posted successfully"}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
