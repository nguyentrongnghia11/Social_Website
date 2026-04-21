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
  Container,
} from "@mui/material"
import { MoreVert } from "@mui/icons-material"
import { Box } from "@mui/system"
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import "react-icons/ai"
import "react-icons/ri"
import { AiFillFileText, AiFillHome, AiFillMessage, AiOutlineSearch, AiFillBell, AiOutlineBell } from "react-icons/ai"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { isLoggedIn, logoutUser } from "../helpers/authHelper"
import UserAvatar from "./UserAvatar"
import HorizontalStack from "./util/HorizontalStack"
import { MdAdminPanelSettings, MdCancel } from "react-icons/md"
import { markAsRead, markAllAsRead as markAllAsReadAPI } from "../api-axios/notification"
import useNotificationStore from "../stores/useNotificationStore"


const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = isLoggedIn()
  const theme = useTheme()
  const username = user && user.user._id
  const [search, setSearch] = useState("")
  const [searchIcon, setSearchIcon] = useState(false)
  const [width, setWindowWidth] = useState(0)
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const notificationOpen = Boolean(notificationAnchor)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(10)
  const notificationScrollRef = useRef(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const menuOpen = Boolean(menuAnchorEl)

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const unreadMsgCount = useNotificationStore((state) => state.unreadMsgCount);

  useEffect(() => {
    const u = isLoggedIn();
    if (u) {
      useNotificationStore.getState().fetchUnreadMsgCount();
    }
  }, []);

  useEffect(() => {
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    setSearchIcon(false)
  }, [location])

  const mobile = width < 500
  const navbarWidth = width < 600

  const updateDimensions = () => {
    const width = window.innerWidth
    setWindowWidth(width)
  }

  const handleNotificationClick = useCallback((event) => {
    setNotificationAnchor(event.currentTarget)
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationAnchor(null)
    setShowAllNotifications(false)
    setDisplayLimit(10)
  }, []);

  const handleMenuClick = useCallback((event) => {
    setMenuAnchorEl(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null)
  }, [])

  const handleNotificationScroll = useCallback((e) => {
    const element = e.target
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
      if (displayLimit < notifications.length) {
        setDisplayLimit(prev => Math.min(prev + 10, notifications.length))
      }
    }
  }, [displayLimit, notifications.length]);

  const markAsReadNof = useCallback(async (notificationId) => {
    try {
      const user = isLoggedIn();
      const reciveId = user?.user?._id || user?._id;
      await markAsRead(notificationId, reciveId)
      useNotificationStore.getState().markAsRead(notificationId)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, []);

  const markAllAsReadHandler = useCallback(async () => {
    try {
      const currentUser = isLoggedIn();
      const receiverId = currentUser?.user?._id || currentUser?._id;
      await markAllAsReadAPI(receiverId)
      useNotificationStore.getState().markAllAsRead()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, []);

  const handleLogout = useCallback(async (e) => {
    await logoutUser()
    useNotificationStore.getState().clearAll()
    useNotificationStore.getState().triggerAuthChange()
    navigate("/login")
  }, [navigate]);

  const handleChange = useCallback((e) => {
    setSearch(e.target.value)
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    navigate("/search?" + new URLSearchParams({ search }))
    setSearchIcon(false)
  }, [search, navigate]);

  const handleSearchIcon = useCallback((e) => {
    setSearchIcon(!searchIcon)
  }, [searchIcon]);

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

  return (
    <Stack mb={2} sx={{ width: '100%', overflow: 'hidden' }}>
      <Container maxWidth="xl" sx={{ width: '100%', overflow: 'hidden' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            pt: 2,
            pb: 0,
            width: '100%',
            overflow: 'hidden',
          }}
          spacing={!mobile ? 2 : 0.5}
        >
          <HorizontalStack spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <img
              src="/logo.png"
              alt="JustVibing Logo"
              style={{
                height: mobile ? 40 : 50,
                width: mobile ? 40 : 50,
                cursor: "pointer",
                objectFit: "cover",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)"
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)"
              }}
              onClick={() => navigate("/")}
            />
            <Typography
              sx={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: mobile ? "1rem" : navbarWidth ? "1.25rem" : "1.75rem",
                letterSpacing: "-0.5px",
                color: "#1a237e",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onClick={() => navigate("/")}
            >
              JustVibing
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

          <HorizontalStack sx={{ flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
            {mobile && (
              <IconButton onClick={handleSearchIcon} sx={{ p: 1 }}>
                <AiOutlineSearch />
              </IconButton>
            )}
            <IconButton component={Link} to={"/"} sx={{ p: 1 }}>
              <AiFillHome />
            </IconButton>
            {user ? (
              <>
                {(user.user?.role === 'admin' || user.user?.role === 'moderator' || user.user?.permissions?.includes('view_admin_panel')) && (
                  <IconButton component={Link} to={"/admin/users"} title="Admin Panel" sx={{ p: 1 }}>
                    <MdAdminPanelSettings />
                  </IconButton>
                )}
                <IconButton component={Link} to={"/messenger"} sx={{ p: 1 }}>
                  <Badge badgeContent={unreadMsgCount > 0 ? unreadMsgCount : 0} color="error" max={99}>
                    <AiFillMessage />
                  </Badge>
                </IconButton>

                {/* Notification Bell */}
                <IconButton onClick={handleNotificationClick} sx={{ p: 1 }}>
                  <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error" max={99}>
                    {unreadCount > 0 ? <AiFillBell style={{ color: theme.palette.primary.main }} /> : <AiOutlineBell />}
                  </Badge>
                </IconButton>

                <IconButton component={Link} to={"/users/" + username} sx={{ p: 1 }}>
                  <UserAvatar width={30} height={30} username={user.username} />
                </IconButton>
                {mobile && (
                  <IconButton onClick={handleMenuClick} sx={{ p: 1 }}>
                    <MoreVert />
                  </IconButton>
                )}
                {!mobile && <Button onClick={handleLogout}>Logout</Button>}
              </>
            ) : (
              <>
                {!mobile && (
                  <>
                    <Button variant="text" sx={{ minWidth: 80 }} onClick={() => navigate("/signup")}>
                      Sign Up
                    </Button>
                    <Button variant="text" sx={{ minWidth: 65 }} onClick={() => navigate("/login")}>
                      Login
                    </Button>
                  </>
                )}
                {mobile && (
                  <IconButton onClick={handleMenuClick} sx={{ p: 1 }}>
                    <MoreVert />
                  </IconButton>
                )}
              </>
            )}
          </HorizontalStack>
        </Stack>

        {navbarWidth && searchIcon && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, mb: 2, display: 'flex', gap: 0.5, width: '100%', boxSizing: 'border-box', px: 2 }}>
            <TextField 
              size="small" 
              label="Search for posts..." 
              fullWidth 
              onChange={handleChange} 
              value={search}
              autoFocus
              sx={{ minWidth: 0 }}
            />
            <IconButton 
              onClick={() => setSearchIcon(false)} 
              sx={{ px: 0.5, flexShrink: 0 }}
              title="Close search"
            >
              <MdCancel />
            </IconButton>
          </Box>
        )}
      </Container>

      <Menu
        anchorEl={notificationAnchor}
        open={notificationOpen}
        onClose={handleNotificationClose}
        slotProps={{
          paper: {
            sx: {
              width: mobile ? "90vw" : 380,
              maxWidth: 400,
              maxHeight: mobile ? "65vh" : 480,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              borderRadius: 2,
            },
          },
        }}
        MenuListProps={{
          sx: {
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: mobile ? "65vh" : 480,
          }
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        disableScrollLock={true}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", flexShrink: 0, bgcolor: "background.paper" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsReadHandler} sx={{ fontSize: "0.75rem" }}>
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Stack>
        </Box>
        <Box
          ref={notificationScrollRef}
          onScroll={handleNotificationScroll}
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            maxHeight: mobile ? "calc(65vh - 100px)" : 380,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.2)",
              borderRadius: "3px",
              "&:hover": {
                background: "rgba(0,0,0,0.3)",
              }
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
            <>
              {notifications.slice(0, showAllNotifications ? displayLimit : 10).map((notification, index) => {
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
                      px: 2,
                      alignItems: "flex-start",
                      minHeight: "auto",
                      whiteSpace: "normal",
                      display: "flex",
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
                    <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          lineHeight: 1.4,
                          whiteSpace: "normal",
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
                          overflowWrap: "break-word",
                          lineHeight: 1.3,
                          whiteSpace: "normal",
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
              })}
              {showAllNotifications && displayLimit < notifications.length && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Đang hiển thị {displayLimit} / {notifications.length} thông báo. Scroll xuống để xem thêm...
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {notifications.length > 0 && !showAllNotifications && notifications.length > 10 && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                setShowAllNotifications(true)
                setDisplayLimit(20)
              }}
              sx={{
                justifyContent: "center",
                flexShrink: 0,
                py: 1,
                bgcolor: "background.paper",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                Xem tất cả thông báo ({notifications.length})
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        {user ? (
          <>
            <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
              Logout
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => { navigate("/signup"); handleMenuClose(); }}>
              Sign Up
            </MenuItem>
            <MenuItem onClick={() => { navigate("/login"); handleMenuClose(); }}>
              Login
            </MenuItem>
          </>
        )}
      </Menu>
    </Stack>
  )
}

export default React.memo(Navbar)
