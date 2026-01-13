"use client"

import { useTheme } from "@emotion/react"
import {
  Avatar,
  IconButton,
  Stack,
  TextField,
  Typography,
  Button,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material"
import { Box } from "@mui/system"
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import "react-icons/ai"
import "react-icons/ri"
import { AiFillFileText, AiFillHome, AiFillMessage, AiOutlineSearch, AiFillBell, AiOutlineBell } from "react-icons/ai"
import { Link, useNavigate } from "react-router-dom"
import { isLoggedIn, logoutUser } from "../helpers/authHelper"
import UserAvatar from "./UserAvatar"
import HorizontalStack from "./util/HorizontalStack"
import { subscribeForemessage } from "../helpers/messaging_getToken"
// socket events handled in NotificationProvider
import { markAsRead } from "../api-axios/notification"
import { useNotification } from "./views/NotificationProvider"


const Navbar = () => {
  const navigate = useNavigate()
  const user = isLoggedIn()
  const theme = useTheme()
  const username = user && isLoggedIn().user._id
  const [search, setSearch] = useState("")
  const [searchIcon, setSearchIcon] = useState(false)
  const [width, setWindowWidth] = useState(0)

  const messageHandlerRef = useRef()

  // Notification states from provider
  const { notifications, unreadCount, markAsRead: providerMarkAsRead, markAllAsRead: providerMarkAllAsRead } = useNotification();
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const notificationOpen = Boolean(notificationAnchor)
  // Unread messages state
  const [unreadMsgCount, setUnreadMsgCount] = useState(() => {
    // Lấy từ localStorage nếu có
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.user?.unreadCount || 0;
  });

  useEffect(() => {
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])


  useEffect(() => {
    if (!user) return

    subscribeForemessage()
    // NotificationProvider will fetch initial notifications
    
    // NotificationProvider handles socket events centrally — do not register here.
  }, [])

  const mobile = width < 500
  const navbarWidth = width < 600

  const updateDimensions = () => {
    const width = window.innerWidth
    setWindowWidth(width)
  }

  // Notifications are provided by NotificationProvider

  const handleNotificationClick = useCallback((event) => {
    setNotificationAnchor(event.currentTarget)
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationAnchor(null)
  }, []);

  const markAsReadNof = useCallback(async (notificationId) => {
    try {
      await markAsRead(notificationId)
      // update provider state
      providerMarkAsRead(notificationId)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAsRead(user._id)
      providerMarkAllAsRead()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [user, providerMarkAllAsRead]);

  const handleLogout = useCallback(async (e) => {
    logoutUser()
    navigate("/login")
  }, [navigate]);

  const handleChange = useCallback((e) => {
    setSearch(e.target.value)
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    navigate("/search?" + new URLSearchParams({ search }))
  }, [search, navigate]);

  const handleSearchIcon = useCallback((e) => {
    setSearchIcon(!searchIcon)
  }, [searchIcon]);

  // Format notification time
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return ""

    try {
      const now = new Date()
      const time = new Date(timestamp)
      const diff = now - time
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return "Vừa xong"
      if (minutes < 60) return `${minutes} phút trước`
      if (hours < 24) return `${hours} giờ trước`
      return `${days} ngày trước`
    } catch (error) {
      return ""
    }
  }, []);

  // Socket listener for new notifications
  // NotificationProvider handles notification socket events; no local socket listeners here.

  return (
    <Stack mb={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pt: 2,
          pb: 0,
        }}
        spacing={!mobile ? 2 : 0}
      >
        <HorizontalStack>
          <AiFillFileText
            size={33}
            color={theme.palette.primary.main}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          />
          <Typography
            sx={{ display: mobile ? "none" : "block", cursor: "pointer" }}
            variant={navbarWidth ? "h6" : "h4"}
            mr={1}
            color={theme.palette.primary.main}
            onClick={() => navigate("/")}
          >
            MindShare
          </Typography>
        </HorizontalStack>

        {!navbarWidth && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              size="small"
              label="Search for posts..."
              sx={{ flexGrow: 1, maxWidth: 300 }}
              onChange={handleChange}
              value={search}
            />
          </Box>
        )}

        <HorizontalStack>
          {mobile && (
            <IconButton onClick={handleSearchIcon}>
              <AiOutlineSearch />
            </IconButton>
          )}
          <IconButton component={Link} to={"/"}>
            <AiFillHome />
          </IconButton>
          {user ? (
            <>

              <IconButton component={Link} to={"/messenger"}>
                <Badge badgeContent={unreadMsgCount > 0 ? unreadMsgCount : 0} color="error" max={99}>
                  <AiFillMessage />
                </Badge>
              </IconButton>

              {/* Notification Bell */}
              <IconButton onClick={handleNotificationClick}>
                <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error" max={99}>
                  {unreadCount > 0 ? <AiFillBell style={{ color: theme.palette.primary.main }} /> : <AiOutlineBell />}
                </Badge>
              </IconButton>

              <IconButton component={Link} to={"/users/" + username}>
                <UserAvatar width={30} height={30} username={user.username} />
              </IconButton>
              <Button onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="text" sx={{ minWidth: 80 }} onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
              <Button variant="text" sx={{ minWidth: 65 }} onClick={() => navigate("/login")}>
                Login
              </Button>
            </>
          )}
        </HorizontalStack>
      </Stack>

      {navbarWidth && searchIcon && (
        <Box component="form" onSubmit={handleSubmit} mt={2}>
          <TextField size="small" label="Search for posts..." fullWidth onChange={handleChange} value={search} />
        </Box>
      )}

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={notificationOpen}
        onClose={handleNotificationClose}
        slotProps={{
          paper: {
            sx: {
              width: mobile ? "90vw" : 380, // Responsive width
              maxWidth: 400,
              maxHeight: mobile ? "80vh" : "70vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              borderRadius: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        disableScrollLock={true} // Tránh scroll lock
      >
        {/* Header - Fixed */}
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", flexShrink: 0, bgcolor: "background.paper" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead} sx={{ fontSize: "0.75rem" }}>
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Stack>
        </Box>

        {/* Content - Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#c1c1c1",
              borderRadius: "3px",
            },
          }}
        >
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2">
                Không có thông báo nào
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => {
              const notificationId = notification._id
              return (
                <MenuItem
                  key={notificationId}
                  onClick={() => {
                    if (!notification.read) markAsReadNof(notificationId)
                    handleNotificationClose()
                    if (notification.link) navigate(notification.link)
                  }}
                  sx={{
                    backgroundColor: notification.read ? "transparent" : "rgba(25, 118, 210, 0.08)",
                    "&:hover": {
                      backgroundColor: notification.read ? "rgba(0, 0, 0, 0.04)" : "rgba(25, 118, 210, 0.12)",
                    },
                    py: 1.5,
                    px: 1,
                    alignItems: "flex-start",
                    minHeight: "auto",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.875rem" }}>
                      {notification.type === "like" && "❤️"}
                      {notification.type === "comment" && "💬"}
                      {notification.type === "follow" && "👤"}
                      {notification.type === "post" && "📝"}
                      {notification.type === "login" && "🔐"}
                      {!notification.type && "🔔"}
                    </Avatar>
                  </ListItemIcon>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{
                        fontWeight: notification.read ? 400 : 600,
                        wordBreak: "break-word",
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.title || "Thông báo mới"}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="div"
                      color="text.secondary"
                      sx={{
                        fontSize: "0.8rem",
                        mt: 0.5,
                        wordBreak: "break-word",
                        lineHeight: 1.3,
                      }}
                    >
                      {notification.message || "Nội dung thông báo"}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="div"
                      color="text.secondary"
                      sx={{ mt: 0.5, fontSize: "0.7rem" }}
                    >
                      {formatTime(notification.createdAt)}
                    </Typography>
                  </Box>
                </MenuItem>
              )
            })
          )}
        </Box>

        {/* Footer - Fixed */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                handleNotificationClose()
                navigate("/notifications")
              }}
              sx={{
                justifyContent: "center",
                flexShrink: 0,
                py: 0,
                bgcolor: "background.paper",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                Xem tất cả thông báo
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </Stack>
  )
}

export default React.memo(Navbar)
