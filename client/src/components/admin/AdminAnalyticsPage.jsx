import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Article,
  ThumbUp,
  Comment,
  Visibility,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  getAnalyticsOverview,
  getAnalyticsUsers,
  getAnalyticsEngagement,
  getAnalyticsContent,
} from '../../api-axios/admin';

const AdminAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { timeRange };
      const [overviewRes, usersRes, engagementRes, contentRes] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsUsers(params),
        getAnalyticsEngagement(params),
        getAnalyticsContent(),
      ]);
      setAnalyticsData({
        overview: overviewRes.data,
        users: usersRes.data,
        engagement: engagementRes.data,
        content: contentRes.data,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải analytics');
    } finally {
      setLoading(false);
    }
  };

  // Sample data for fallback
  const userGrowthData = [
    { date: '01/03', users: 1050, newUsers: 45, activeUsers: 756 },
    { date: '02/03', users: 1095, newUsers: 45, activeUsers: 782 },
    { date: '03/03', users: 1148, newUsers: 53, activeUsers: 801 },
    { date: '04/03', users: 1186, newUsers: 38, activeUsers: 825 },
    { date: '05/03', users: 1234, newUsers: 48, activeUsers: 843 },
    { date: '06/03', users: 1289, newUsers: 55, activeUsers: 867 },
    { date: '07/03', users: 1342, newUsers: 53, activeUsers: 891 },
  ];

  const engagementData = [
    { date: '01/03', posts: 123, likes: 456, comments: 234, views: 3450 },
    { date: '02/03', posts: 145, likes: 523, comments: 267, views: 3821 },
    { date: '03/03', posts: 167, likes: 601, comments: 298, views: 4123 },
    { date: '04/03', posts: 152, likes: 578, comments: 281, views: 3967 },
    { date: '05/03', posts: 189, likes: 687, comments: 345, views: 4523 },
    { date: '06/03', posts: 201, likes: 734, comments: 378, views: 4891 },
    { date: '07/03', posts: 198, likes: 721, comments: 367, views: 4756 },
  ];

  const deviceData = [
    { name: 'Mobile', value: 65, color: '#0088FE' },
    { name: 'Desktop', value: 28, color: '#00C49F' },
    { name: 'Tablet', value: 7, color: '#FFBB28' },
  ];

  const topContentData = [
    { category: 'Technology', posts: 450, engagement: 8234 },
    { category: 'Lifestyle', posts: 380, engagement: 6789 },
    { category: 'Education', posts: 320, engagement: 5432 },
    { category: 'Entertainment', posts: 290, engagement: 4987 },
    { category: 'Business', posts: 210, engagement: 3876 },
  ];

  const retentionData = [
    { day: 'Day 1', rate: 100 },
    { day: 'Day 3', rate: 68 },
    { day: 'Day 7', rate: 45 },
    { day: 'Day 14', rate: 32 },
    { day: 'Day 30', rate: 24 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const stats = [
    {
      title: 'DAU (Daily Active Users)',
      value: '891',
      change: '+12.5%',
      changeType: 'positive',
      icon: <People sx={{ fontSize: 40 }} />,
      color: 'primary',
    },
    {
      title: 'MAU (Monthly Active Users)',
      value: '12,450',
      change: '+8.3%',
      changeType: 'positive',
      icon: <People sx={{ fontSize: 40 }} />,
      color: 'success',
    },
    {
      title: 'Tổng Bài viết',
      value: '3,420',
      change: '+15.2%',
      changeType: 'positive',
      icon: <Article sx={{ fontSize: 40 }} />,
      color: 'info',
    },
    {
      title: 'Tỷ lệ Tương tác',
      value: '68.5%',
      change: '+5.1%',
      changeType: 'positive',
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: 'warning',
    },
  ];

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            Thống kê & Phân tích
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dữ liệu chi tiết về người dùng và hoạt động hệ thống
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Khoảng thời gian</InputLabel>
          <Select
            value={timeRange}
            label="Khoảng thời gian"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="24hours">24 giờ qua</MenuItem>
            <MenuItem value="7days">7 ngày qua</MenuItem>
            <MenuItem value="30days">30 ngày qua</MenuItem>
            <MenuItem value="90days">90 ngày qua</MenuItem>
            <MenuItem value="1year">1 năm qua</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={stat.changeType === 'positive' ? 'success.main' : 'error.main'}
                    >
                      {stat.change} so với kỳ trước
                    </Typography>
                  </Box>
                  <Box color={`${stat.color}.main`}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Growth Chart */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tăng trưởng Người dùng
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="Tổng người dùng"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorActive)"
                    name="Người dùng hoạt động"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thiết bị truy cập
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Engagement Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chỉ số Tương tác
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="posts" stroke="#8884d8" name="Bài viết" />
                  <Line type="monotone" dataKey="likes" stroke="#82ca9d" name="Likes" />
                  <Line type="monotone" dataKey="comments" stroke="#ffc658" name="Bình luận" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content & Retention */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Danh mục Nội dung
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topContentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#8884d8" name="Số bài viết" />
                  <Bar dataKey="engagement" fill="#82ca9d" name="Tương tác" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tỷ lệ Giữ chân (Retention)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#ff7300"
                    fill="#ff7300"
                    name="Tỷ lệ quay lại"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Article sx={{ fontSize: 50, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    198
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bài viết hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ThumbUp sx={{ fontSize: 50, color: 'success.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    721
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Likes hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Comment sx={{ fontSize: 50, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    367
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bình luận hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Visibility sx={{ fontSize: 50, color: 'info.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    4.7K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lượt xem hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalyticsPage;
