"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Badge,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Flag,
  ThumbUp,
  Comment,
  Image,
  VideoLibrary,
  FilterList,
  Download,
} from "@mui/icons-material"
import * as adminApi from "../api-axios/admin"

const AdminPosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch posts from API
  useEffect(() => {
    fetchPosts()
  }, [searchTerm, filterStatus, filterCategory])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        search: searchTerm,
        status: filterStatus !== "all" ? filterStatus : undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
      }
      const response = await adminApi.getPosts(params)

      console.log ("Fetched posts:", response.data.data)
      setPosts(response.data.data || [])
    } catch (err) {
      console.error("Error fetching posts:", err)
      setError(err.response?.data?.message || "Không thể tải danh sách bài viết")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuClick = (event, post) => {
    setAnchorEl(event.currentTarget)
    setSelectedPost(post)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedPost(null)
  }

  const handleDeletePost = () => {
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const confirmDeletePost = async () => {
    if (!selectedPost) return
    
    try {
      await adminApi.deletePost(selectedPost.id)
      setPosts(posts.filter((post) => post.id !== selectedPost.id))
      setDeleteDialogOpen(false)
      setSelectedPost(null)
    } catch (err) {
      console.error("Error deleting post:", err)
      setError(err.response?.data?.message || "Không thể xóa bài viết")
    }
  }

  const handleToggleVisibility = async () => {
    if (!selectedPost) return

    try {
      const newStatus = selectedPost.status === "hidden" ? "published" : "hidden"
      await adminApi.updatePostVisibility(selectedPost.id, newStatus)
      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id ? { ...post, status: newStatus } : post,
        ),
      )
      handleMenuClose()
    } catch (err) {
      console.error("Error updating post visibility:", err)
      setError(err.response?.data?.message || "Không thể cập nhật trạng thái")
    }
  }

  const handleApprovePost = async () => {
    if (!selectedPost) return

    try {
      await adminApi.updatePostVisibility(selectedPost.id, "published")
      setPosts(posts.map((post) => (post.id === selectedPost.id ? { ...post, status: "published" } : post)))
      handleMenuClose()
    } catch (err) {
      console.error("Error approving post:", err)
      setError(err.response?.data?.message || "Không thể duyệt bài viết")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "success"
      case "pending":
        return "warning"
      case "reported":
        return "error"
      case "hidden":
        return "default"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "published":
        return "Đã xuất bản"
      case "pending":
        return "Chờ duyệt"
      case "reported":
        return "Bị báo cáo"
      case "hidden":
        return "Đã ẩn"
      default:
        return status
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || post.status === filterStatus
    const matchesCategory = filterCategory === "all" || post.category === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Quản lý bài viết
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Download />} size="small">
            Xuất dữ liệu
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="published">Đã xuất bản</MenuItem>
                  <MenuItem value="pending">Chờ duyệt</MenuItem>
                  <MenuItem value="reported">Bị báo cáo</MenuItem>
                  <MenuItem value="hidden">Đã ẩn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Danh mục</InputLabel>
                <Select value={filterCategory} label="Danh mục" onChange={(e) => setFilterCategory(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Lifestyle">Lifestyle</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" startIcon={<FilterList />} size="small">
                Lọc
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <Typography color="text.secondary">Không có bài viết nào</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bài viết</TableCell>
                    <TableCell>Tác giả</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell>Thống kê</TableCell>
                    <TableCell>Media</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPosts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Box sx={{ maxWidth: 300 }}>
                          <Typography variant="subtitle2" fontWeight="medium" noWrap>
                            {post.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {post.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={post.authorAvatar || post.author?.avatar} sx={{ width: 32, height: 32 }}>
                            {(post.author?.name || post.author || "U").charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{post.author?.name || post.author || "Unknown"}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          <Chip label={getStatusLabel(post.status)} color={getStatusColor(post.status)} size="small" />
                          {post.reports > 0 && (
                            <Badge badgeContent={post.reports} color="error">
                              <Flag color="error" fontSize="small" />
                            </Badge>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(post.createdDate || post.createdAt).toLocaleDateString("vi-VN")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Visibility fontSize="small" color="action" />
                            <Typography variant="caption">{post.views || 0}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <ThumbUp fontSize="small" color="action" />
                            <Typography variant="caption">{post.likes || post.likesCount || 0}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Comment fontSize="small" color="action" />
                            <Typography variant="caption">{post.comments || post.commentsCount || 0}</Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {(post.hasImages || post.media?.images?.length > 0) && <Image fontSize="small" color="primary" />}
                          {(post.hasVideos || post.media?.videos?.length > 0) && <VideoLibrary fontSize="small" color="secondary" />}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, post)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPosts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
            />
          </>
        )}
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => window.open(`/posts/${selectedPost?.id}`, "_blank")}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          Xem bài viết
        </MenuItem>
        <MenuItem onClick={() => {}}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        {selectedPost?.status === "pending" && (
          <MenuItem onClick={handleApprovePost}>
            <ThumbUp fontSize="small" sx={{ mr: 1 }} />
            Duyệt bài viết
          </MenuItem>
        )}
        <MenuItem onClick={handleToggleVisibility}>
          {selectedPost?.status === "hidden" ? (
            <>
              <Visibility fontSize="small" sx={{ mr: 1 }} />
              Hiển thị
            </>
          ) : (
            <>
              <VisibilityOff fontSize="small" sx={{ mr: 1 }} />
              Ẩn bài viết
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeletePost} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa bài viết <strong>"{selectedPost?.title}"</strong>? Hành động này không thể hoàn
            tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={confirmDeletePost}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminPosts
