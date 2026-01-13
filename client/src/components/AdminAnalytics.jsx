"use client"

import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import {
  TrendingUp,
  TrendingDown,
  People,
  Article,
  Visibility,
  ThumbUp,
  Download,
  DateRange,
} from "@mui/icons-material"
import { CustomChart } from "./CustomerChart"

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7days")
  const [chartType, setChartType] = useState("line")

  const stats = {
    totalUsers: { value: 1234, change: "+12%", trend: "up" },
    totalPosts: { value: 567, change: "+8%", trend: "up" },
    totalViews: { value: 89012, change: "+15%", trend: "up" },
    totalLikes: { value: 12345, change: "-2%", trend: "down" },
    activeUsers: { value: 156, change: "+5%", trend: "up" },
    newUsers: { value: 23, change: "+18%", trend: "up" },
    engagement: { value: "68%", change: "+3%", trend: "up" },
    retention: { value: "45%", change: "-1%", trend: "down" },
  }

  const topPosts = [
    {
      id: 1,
      title: "Hướng dẫn học React cho người mới bắt đầu",
      author: "Nguyễn Văn A",
      views: 1250,
      likes: 89,
      comments: 23,
      engagement: "7.2%",
    },
    {
      id: 2,
      title: "Kinh nghiệm làm việc remote hiệu quả",
      author: "Trần Thị B",
      views: 890,
      likes: 67,
      comments: 15,
      engagement: "9.2%",
    },
    {
      id: 3,
      title: "Tips để code clean và maintainable",
      author: "Lê Văn C",
      views: 756,
      likes: 54,
      comments: 12,
      engagement: "8.7%",
    },
  ]

  const topUsers = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      posts: 25,
      likes: 450,
      comments: 123,
      followers: 89,
    },
    {
      id: 2,
      name: "Trần Thị B",
      posts: 18,
      likes: 320,
      comments: 98,
      followers: 67,
    },
    {
      id: 3,
      name: "Lê Văn C",
      posts: 22,
      likes: 280,
      comments: 76,
      followers: 54,
    },
  ]

  const StatCard = ({ title, value, change, trend, icon, color = "primary" }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              {trend === "up" ? (
                <TrendingUp color="success" fontSize="small" />
              ) : (
                <TrendingDown color="error" fontSize="small" />
              )}
              <Typography variant="body2" color={trend === "up" ? "success.main" : "error.main"} fontWeight="medium">
                {change}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                so với kỳ trước
              </Typography>
            </Stack>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}.light`,
              color: `${color}.contrastText`,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Phân tích & Thống kê
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Thời gian</InputLabel>
            <Select value={timeRange} label="Thời gian" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="7days">7 ngày</MenuItem>
              <MenuItem value="30days">30 ngày</MenuItem>
              <MenuItem value="90days">90 ngày</MenuItem>
              <MenuItem value="1year">1 năm</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download />} size="small">
            Xuất báo cáo
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng người dùng"
            value={stats.totalUsers.value}
            change={stats.totalUsers.change}
            trend={stats.totalUsers.trend}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng bài viết"
            value={stats.totalPosts.value}
            change={stats.totalPosts.change}
            trend={stats.totalPosts.trend}
            icon={<Article />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lượt xem"
            value={stats.totalViews.value}
            change={stats.totalViews.change}
            trend={stats.totalViews.trend}
            icon={<Visibility />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lượt thích"
            value={stats.totalLikes.value}
            change={stats.totalLikes.change}
            trend={stats.totalLikes.trend}
            icon={<ThumbUp />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Người dùng hoạt động"
            value={stats.activeUsers.value}
            change={stats.activeUsers.change}
            trend={stats.activeUsers.trend}
            icon={<People />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Người dùng mới"
            value={stats.newUsers.value}
            change={stats.newUsers.change}
            trend={stats.newUsers.trend}
            icon={<People />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tỷ lệ tương tác"
            value={stats.engagement.value}
            change={stats.engagement.change}
            trend={stats.engagement.trend}
            icon={<TrendingUp />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tỷ lệ giữ chân"
            value={stats.retention.value}
            change={stats.retention.change}
            trend={stats.retention.trend}
            icon={<DateRange />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Charts */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Biểu đồ hoạt động
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                    <MenuItem value="line">Đường</MenuItem>
                    <MenuItem value="bar">Cột</MenuItem>
                    <MenuItem value="pie">Tròn</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <CustomChart type={chartType} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Bài viết hàng đầu
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tiêu đề</TableCell>
                      <TableCell>Tác giả</TableCell>
                      <TableCell align="right">Lượt xem</TableCell>
                      <TableCell align="right">Lượt thích</TableCell>
                      <TableCell align="right">Bình luận</TableCell>
                      <TableCell align="right">Tương tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topPosts.map((post, index) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip label={index + 1} size="small" color="primary" variant="outlined" />
                            <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                              {post.title}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{post.author}</TableCell>
                        <TableCell align="right">{post.views.toLocaleString()}</TableCell>
                        <TableCell align="right">{post.likes}</TableCell>
                        <TableCell align="right">{post.comments}</TableCell>
                        <TableCell align="right">
                          <Chip label={post.engagement} size="small" color="success" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Người dùng tích cực nhất
              </Typography>
              <Stack spacing={2}>
                {topUsers.map((user, index) => (
                  <Box key={user.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip label={index + 1} size="small" color="primary" variant="outlined" />
                        <Typography variant="body2" fontWeight="medium">
                          {user.name}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 1, ml: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        {user.posts} bài viết
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.likes} lượt thích
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.comments} bình luận
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminAnalytics
