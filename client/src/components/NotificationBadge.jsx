import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
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
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    console.log('Notification clicked:', notification);
    if (!notification.read) markAsRead(notification._id);

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

      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 600,
            maxWidth: '100vw',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
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

        <Box sx={{ 
          maxHeight: 500, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            }
          }
        }}>
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
                    px: 2,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getAvatarColor(notification.type) }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{
                      overflow: 'hidden',
                      pr: 1,
                    }}
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" sx={{ 
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Circle sx={{ fontSize: 8, color: 'primary.main', flexShrink: 0 }} />
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
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
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
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBadge;
