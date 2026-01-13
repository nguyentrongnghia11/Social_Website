"use client"

import { useState, useEffect } from "react"
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  TrendingUp,
  TrendingDown,
  People,
  Article,
  Visibility,
  ThumbUp,
  Warning,
  CheckCircle,
  Schedule,
  Notifications,
} from "@mui/icons-material"
import { CustomChart } from "./CustomerChart"
import { getDashboard, getRecentActivities } from "../api-axios/admin"

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    newUsersToday: 0,
    newPostsToday: 0,
    activeUsers: 0,
    pendingReports: 0,
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [systemHealth, setSystemHealth] = useState({
    serverStatus: "healthy",
    databaseStatus: "healthy",
    storageUsage: 67,
    memoryUsage: 45,
    cpuUsage: 32,
  })

  useEffect(() => {
    console.log ("q2w3e4r")
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardRes, activitiesRes] = await Promise.all([
        getDashboard(),
        getRecentActivities()
      ])
      
      if (dashboardRes.data) {
        console.log('Dashboard Dataaaa:', dashboardRes.data)
        setStats({
          totalUsers: dashboardRes.data.totalUsers || 0,
          totalPosts: dashboardRes.data.totalPosts || 0,
          totalViews: dashboardRes.data.totalViews || 0,
          totalLikes: dashboardRes.data.totalLikes || 0,
          totalComments: dashboardRes.data.totalComments || 0,
          newUsersToday: dashboardRes.data.newUsersToday || 0,
          newPostsToday: dashboardRes.data.newPostsToday || 0,
          activeUsers: dashboardRes.data.activeUsers || 0,
          pendingReports: dashboardRes.data.pendingReports || 0,
        })
      }

      if (activitiesRes.data) {
        setRecentActivity(activitiesRes.data.data || [])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, change, changeType, icon, color = "primary" }) => (
    <Card
      sx={{
        height: "100%",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
       
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="body2"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                lineHeight: 1.2,
                mb: 1,
              }}
            >
              {value.toLocaleString()}
            </Typography>
            {change && (
              <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                {changeType === "increase" ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={changeType === "increase" ? "success.main" : "error.main"}
                  fontWeight="medium"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {change}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                  từ hôm qua
                </Typography>
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              p: { xs: 0.75, sm: 1 },
              borderRadius: 2,
              backgroundColor: `${color}.light`,
              color: `${color}.contrastText`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: { xs: 36, sm: 40 },
              minHeight: { xs: 36, sm: 40 },
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  const getActivityIcon = (type) => {
    switch (type) {
      case "user_join":
        return <People color="primary" />
      case "post_create":
        return <Article color="success" />
      case "report":
        return <Warning color="error" />
      case "like":
        return <ThumbUp color="info" />
      default:
        return <Notifications />
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case "user_join":
        return "primary"
      case "post_create":
        return "success"
      case "report":
        return "error"
      case "like":
        return "info"
      default:
        return "default"
    }
  }

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button size="small" onClick={loadDashboardData} sx={{ ml: 2 }}>
            Thử lại
          </Button>
        </Alert>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tổng người dù"
                value={stats.totalUsers}
                change="+12%"
                changeType="increase"
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tổng bài viết"
                value={stats.totalPosts}
                change="+8%"
                changeType="increase"
                icon={<Article />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Lượt xem"
                value={stats.totalViews}
                change="+15%"
                changeType="increase"
                icon={<Visibility />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Lượt thích"
                value={stats.totalLikes}
                change="+5%"
                changeType="increase"
                icon={<ThumbUp />}
                color="warning"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Lượt bình luận"
                value={stats.totalComments}
                change="+5%"
                changeType="increase"
                icon={<ThumbUp />}
                color="warning"
              />
            </Grid>
          </Grid>
        </>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3, width: "100%", overflow: "hidden" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Thống kê hoạt động
              </Typography>
              <Box sx={{ width: "100%", overflow: "hidden" }}>
                <CustomChart type="line" />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ width: "100%", overflow: "hidden" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Phân tích người dùng
              </Typography>
              <Box sx={{ width: "100%", overflow: "hidden" }}>
                <CustomChart type="bar" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* System Health */}
          <Card sx={{ mb: 3, width: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Tình trạng hệ thống
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Server</Typography>
                    <Chip label="Healthy" color="success" size="small" icon={<CheckCircle />} />
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2">Storage</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {systemHealth.storageUsage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.storageUsage}
                    color={systemHealth.storageUsage > 80 ? "error" : "primary"}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2">Memory</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {systemHealth.memoryUsage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.memoryUsage}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2">CPU</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {systemHealth.cpuUsage}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={systemHealth.cpuUsage}
                    color="info"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ width: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
                flexWrap="wrap"
                spacing={1}
              >
                <Typography variant="h6" fontWeight="bold">
                  Hoạt động gần đây
                </Typography>
                <Button size="small">Xem tất cả</Button>
              </Stack>

              <List sx={{ p: 0 }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <Box key={activity.id || activity._id || index}>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemAvatar>
                          <Avatar
                            src={activity.avatar || activity.user?.avatar}
                            sx={{
                              bgcolor: `${getActivityColor(activity.type)}.light`,
                              color: `${getActivityColor(activity.type)}.main`,
                              width: 36,
                              height: 36,
                            }}
                          >
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                              <strong>{activity.user?.name || activity.user}</strong> {activity.action}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Schedule fontSize="small" />
                              <Typography variant="caption">{activity.time}</Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider />}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Chưa có hoạt động nào
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


    </Box>
  )
}

export default AdminOverview
