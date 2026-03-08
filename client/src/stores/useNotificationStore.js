import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { markAsRead as markAsReadAPI } from '../api-axios/notification';
import { getTotalUnreadCount } from '../api-axios/messages';
import { isLoggedIn } from '../helpers/authHelper';

const useNotificationStore = create(
    devtools(
        (set, get) => ({
            // Auth trigger for socket listeners
            authTrigger: Date.now(),
            
            // Notification State
            notifications: [],
            unreadCount: 0,
            snackbar: {
                open: false,
                message: '',
                link: null,
            },

            // Message State
            unreadMsgCount: 0,
            conversations: [],
            activeConversation: null,

            // Notification Actions
            setNotifications: (notifications) => {
                const unread = notifications.filter(n => !n.read).length;
                set({ notifications, unreadCount: unread });
            },

            addNotification: (notification) => {
                set((state) => {
                    const newNotifications = [notification, ...state.notifications].slice(0, 50);
                    const newUnreadCount = !notification.read ? state.unreadCount + 1 : state.unreadCount;
                    return {
                        notifications: newNotifications,
                        unreadCount: newUnreadCount,
                    };
                });
            },

            markAsRead: async (notificationId) => {
                try {
                    const user = isLoggedIn();
                    const reciveId = user?.user?._id || user?._id;

                    await markAsReadAPI(notificationId, reciveId);

                    set((state) => ({
                        notifications: state.notifications.map(n =>
                            n._id === notificationId ? { ...n, read: true } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1),
                    }));
                } catch (error) {
                    console.error('Failed to mark notification as read:', error);
                }
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map(n => ({ ...n, read: true })),
                    unreadCount: 0,
                }));
            },

            // Snackbar actions
            showSnackbar: ({ message = "Posted successfully", link = null }) => {
                set((state) => ({
                    snackbar: {
                        open: true,
                        message,
                        link,
                    },
                }));

                // Play notification sound
                try {
                    const audio = new Audio('/notification-sound.mp3');
                    audio.volume = 0.3;
                    audio.play().catch(() => {});
                } catch (error) {}
            },

            hideSnackbar: () => {
                set((state) => ({
                    snackbar: {
                        ...state.snackbar,
                        open: false,
                    },
                }));
            },

            clearSnackbarLink: () => {
                set((state) => ({
                    snackbar: {
                        ...state.snackbar,
                        link: null,
                    },
                }));
            },

            // Clear all notifications
            clearNotifications: () => {
                set({ notifications: [], unreadCount: 0 });
            },

            // Message Actions
            setUnreadMsgCount: (count) => set({ unreadMsgCount: count }),

            incrementUnreadMsgCount: () => {
                set((state) => ({ unreadMsgCount: state.unreadMsgCount + 1 }));
            },

            decrementUnreadMsgCount: () => {
                set((state) => ({ unreadMsgCount: Math.max(0, state.unreadMsgCount - 1) }));
            },

            resetUnreadMsgCount: () => set({ unreadMsgCount: 0 }),

            fetchUnreadMsgCount: async () => {
                try {
                    const response = await getTotalUnreadCount();
                    console.log('Fetched total unread count:', response);

                    if (response?.data?.totalUnreadCount !== undefined) {
                        set({ unreadMsgCount: response.data.totalUnreadCount });
                    }
                } catch (error) {
                    console.error('Failed to fetch unread message count:', error);
                }
            },

            // Handle incoming message (from socket)
            handleNewMessage: (data, currentUserId) => {
                const senderId = data?.msg?.senderId?._id || data?.msg?.senderId;
                if (senderId !== currentUserId) {
                    get().incrementUnreadMsgCount();
                }
            },

            // Handle message read (from socket)
            handleMessageRead: () => {
                get().decrementUnreadMsgCount();
            },

            // Handle all messages read (from socket)
            handleAllMessagesRead: () => {
                get().resetUnreadMsgCount();
            },

            // Conversations management
            setConversations: (conversations) => set({ conversations }),
            
            setActiveConversation: (conversation) => set({ activeConversation: conversation }),

            // Clear all (notifications + messages)
            clearAll: () => {
                set({ 
                    notifications: [], 
                    unreadCount: 0,
                    unreadMsgCount: 0, 
                    conversations: [], 
                    activeConversation: null 
                });
            },

            // Trigger auth change (call after login/logout)
            triggerAuthChange: () => set({ authTrigger: Date.now() }),
        }),
        { name: 'NotificationStore' }
    )
);

export default useNotificationStore;
