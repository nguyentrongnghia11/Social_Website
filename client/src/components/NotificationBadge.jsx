import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  Circle,
  Favorite as FavoriteIcon,
  PersonAdd as PersonAddIcon,
  Comment as CommentIcon,
  Message as MessageIcon,
  Mail as MailIcon,
  Login as LoginIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './views/NotificationProvider';

const NotificationBadge = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  // NotificationProvider handles event registration; this component just consumes context.

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read in provider
    if (!notification.read) markAsRead(notification._id);

    // Navigate to link if exists
    if (notification.link) {
      navigate(notification.link);
    }

    handleClose();
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FavoriteIcon sx={{ color: '#e91e63' }} />;
      case 'follow':
        return <PersonAddIcon sx={{ color: '#2196f3' }} />;
      case 'comment':
        return <CommentIcon sx={{ color: '#ff9800' }} />;
      case 'message':
        return <MessageIcon sx={{ color: '#4caf50' }} />;
      case 'invite':
        return <MailIcon sx={{ color: '#9c27b0' }} />;
      case 'login':
        return <LoginIcon sx={{ color: '#607d8b' }} />;
      default:
        return <CampaignIcon sx={{ color: '#795548' }} />;
    }
  };

  const getAvatarColor = (type) => {
    switch (type) {
      case 'like':
        return '#fce4ec';
      case 'follow':
        return '#e3f2fd';
      case 'comment':
        return '#fff3e0';
      case 'message':
        return '#e8f5e9';
      case 'invite':
        return '#f3e5f5';
      case 'login':
        return '#eceff1';
      default:
        return '#efebe9';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          timeout: 300,
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
          <Typography variant="h6" fontWeight={600}>Thông báo</Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={handleMarkAllRead}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary" variant="body2">
              Không có thông báo nào
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id || index}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    py: 1.5,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getAvatarColor(notification.type) }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={0.5}
                        >
                          {formatTime(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBadge;
