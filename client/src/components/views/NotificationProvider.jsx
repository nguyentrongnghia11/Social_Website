import React, { createContext, useContext, useState, useEffect } from "react";
import { Snackbar, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from '@mui/icons-material'
import { onEvent, offEvent, initiateSocketConnection } from "../../helpers/socketHelper";
import { isLoggedIn } from "../../helpers/authHelper";

import { getNotifications } from "../../api-axios/notification";



const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [link, setLink] = useState("");
    // Notifications list and unread count (shared across app)
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    // Hiển thị Snackbar
    const showNotification = ({ message = "Posted successfully", link = "123" }) => {
        setMessage(message);
        setLink(link);
        setOpen(true);
    };

    // Đóng Snackbar
    const handleClose = (event, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
        setLink(null);
    };

    // Chuyển hướng nếu có link
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

    // Helper to add a notification to the shared list
    const addNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
        if (!notification.read) setUnreadCount((prev) => prev + 1);
    };

    const markAsRead = (notificationId) => {
        setNotifications((prev) => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    // Handle like notification
    const handleLikeNotification = (notification) => {

        showNotification({ 
            message: notification.message || "Someone liked your post", 
            link: notification.link 
        });
    };

    // Handle follow notification
    const handleFollowNotification = (notification) => {

        showNotification({ 
            message: notification.message || "You have a new follower", 
            link: notification.link 
        });
    };

    // Handle comment notification
    const handleCommentNotification = (notification) => {

        showNotification({ 
            message: notification.message || "New comment on your post", 
            link: notification.link 
        });
    };

    // Handle message notification
    const handleMessageNotification = (notification) => {

        // add to list and show toast
        addNotification(notification)
        showNotification({ 
            message: notification.message || "You have a new message", 
            link: notification.link 
        });
    };

    // Handle invite notification
    const handleInviteNotification = (notification) => {

        showNotification({ 
            message: notification.message || "You have a new invitation", 
            link: notification.link 
        });
    };

    // Handle login notification
    const handleLoginNotification = (notification) => {
        showNotification({ 
            message: notification.message || "New login detected", 
            link: null 
        });
    };

    useEffect(() => {
        const user = isLoggedIn();
        
        // Chỉ đăng ký events khi user đã login
            if (!user) {
            return;
        }

        // Khởi tạo socket connection trước
        const socket = initiateSocketConnection();
        if (!socket) {
            console.warn('Failed to initialize socket connection');
            return;
        }

        // Fetch initial notifications for user
        (async () => {
            try {
                const resp = await getNotifications();
                // response format: { message, data: [ { list: [...], totalUnread: [ {count} ] } ] }
                const payload = resp.data?.data || resp.data?.result || resp.data;
                if (Array.isArray(payload) && payload.length > 0) {
                    const notificationData = payload[0];
                    setNotifications(notificationData.list || []);
                    setUnreadCount(Number(notificationData?.totalUnread?.[0]?.count) || 0);
                }
            } catch (err) {
                console.error('Failed to load initial notifications', err);
            }
        })();
        
        // Register all event listeners
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
    }, [])


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
