import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Article,
  TrendingUp,
  Report,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboard, getRecentActivities } from '../../api-axios/admin';

const AdminOverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, activitiesRes] = await Promise.all([
        getDashboard(),
        getRecentActivities(),
      ]);

      console.log ("Dashboard Data:", dashboardRes.data.data);
      console.log ("Dashboardd Data:", activitiesRes.data.data);
      setStats(dashboardRes.data.data || {});
      
      // Ensure recentActivities is always an array
      const activities = activitiesRes.data;
      if (Array.isArray(activities)) {
        setRecentActivities(activities);
      } else if (activities && Array.isArray(activities.activities)) {
        setRecentActivities(activities.activities);
      } else if (activities && Array.isArray(activities.data)) {
        setRecentActivities(activities.data);
      } else {
        console.log('Activities data structure:', activities);
        setRecentActivities([]);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'T2', users: 65, posts: 120 },
    { name: 'T3', users: 78, posts: 145 },
    { name: 'T4', users: 90, posts: 167 },
    { name: 'T5', users: 81, posts: 152 },
    { name: 'T6', users: 95, posts: 189 },
    { name: 'T7', users: 110, posts: 210 },
    { name: 'CN', users: 88, posts: 165 },
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Tổng quan Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Thống kê tổng quan hệ thống MindShare
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : !stats ? (
        <Alert severity="warning">Không có dữ liệu</Alert>
      ) : (
        <>
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="small-box bg-info">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.overview.totalUsers}
                  </Typography>
                  <Typography variant="body2">Tổng Người dùng</Typography>
                  <Typography variant="caption" color="success.main">
                    +{stats.overview.newUsersToday} hôm nay
                  </Typography>
                </Box>
                <People sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="small-box bg-success">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.overview.totalPosts}
                  </Typography>
                  <Typography variant="body2">Tổng Bài viết</Typography>
                  <Typography variant="caption" color="success.main">
                    +{stats.overview.postsToday} hôm nay
                  </Typography>
                </Box>
                <Article sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="small-box bg-warning">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.reportStats.pending}
                  </Typography>
                  <Typography variant="body2">Báo cáo Chờ xử lý</Typography>
                  <Typography variant="caption">
                    /{stats.reportStats.total} tổng
                  </Typography>
                </Box>
                <Report sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="small-box bg-danger">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.engagement}%
                  </Typography>
                  <Typography variant="body2">Tỷ lệ Tương tác</Typography>
                  <Typography variant="caption">
                    {stats.activeUsers} active
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 60, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Người dùng mới theo tuần
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" name="Người dùng" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bài viết mới theo tuần
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#82ca9d" name="Bài viết" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hoạt động gần đây
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Loại</TableCell>
                  <TableCell>Hành động</TableCell>
                  <TableCell>Người thực hiện</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <TableRow key={activity.id || activity._id || `activity-${index}`}>
                      <TableCell>
                        <Chip
                          label={activity.type}
                          size="small"
                          color={
                            activity.type === 'user' ? 'primary' :
                            activity.type === 'post' ? 'success' :
                            activity.type === 'report' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>{activity.time}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow key="no-activities">
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Không có hoạt động gần đây
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      </>
      )}
    </Box>
  );
};

export default AdminOverviewPage;
