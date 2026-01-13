"use client"

import { useState } from "react"
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
} from "@mui/material"
import { Search, MoreVert, Edit, Delete, Block, Add, FilterList, Download } from "@mui/icons-material"

const AdminUsers = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "a@example.com",
      username: "nguyenvana",
      role: "user",
      status: "active",
      joinDate: "2024-01-15",
      lastLogin: "2024-03-15",
      postsCount: 25,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "b@example.com",
      username: "tranthib",
      role: "moderator",
      status: "active",
      joinDate: "2024-02-10",
      lastLogin: "2024-03-14",
      postsCount: 18,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "c@example.com",
      username: "levanc",
      role: "user",
      status: "suspended",
      joinDate: "2024-01-20",
      lastLogin: "2024-03-10",
      postsCount: 5,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      email: "d@example.com",
      username: "phamthid",
      role: "admin",
      status: "active",
      joinDate: "2023-12-01",
      lastLogin: "2024-03-15",
      postsCount: 42,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleEditUser = () => {
    setEditDialogOpen(true)
    handleMenuClose()
  }

  const handleDeleteUser = () => {
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const handleSuspendUser = () => {
    if (selectedUser) {
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id
            ? { ...user, status: user.status === "suspended" ? "active" : "suspended" }
            : user,
        ),
      )
    }
    handleMenuClose()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success"
      case "suspended":
        return "error"
      case "pending":
        return "warning"
      default:
        return "default"
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error"
      case "moderator":
        return "warning"
      case "user":
        return "primary"
      default:
        return "default"
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Quản lý người dùng
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Download />} size="small">
            Xuất dữ liệu
          </Button>
          <Button variant="contained" startIcon={<Add />} size="small">
            Thêm người dùng
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
                placeholder="Tìm kiếm người dùng..."
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
                <InputLabel>Vai trò</InputLabel>
                <Select value={filterRole} label="Vai trò" onChange={(e) => setFilterRole(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select value={filterStatus} label="Trạng thái" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="suspended">Bị khóa</MenuItem>
                  <MenuItem value="pending">Chờ duyệt</MenuItem>
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

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Người dùng</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tham gia</TableCell>
                <TableCell>Lần cuối online</TableCell>
                <TableCell>Bài viết</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={user.avatar} alt={user.name}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.role} color={getRoleColor(user.role)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(user.joinDate).toLocaleDateString("vi-VN")}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(user.lastLogin).toLocaleDateString("vi-VN")}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.postsCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, user)}>
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
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
        />
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditUser}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={handleSuspendUser}>
          <Block fontSize="small" sx={{ mr: 1 }} />
          {selectedUser?.status === "suspended" ? "Kích hoạt" : "Khóa tài khoản"}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Tên" defaultValue={selectedUser?.name} />
            <TextField fullWidth label="Email" defaultValue={selectedUser?.email} />
            <TextField fullWidth label="Username" defaultValue={selectedUser?.username} />
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select defaultValue={selectedUser?.role} label="Vai trò">
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Hủy</Button>
          <Button variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.name}</strong>? Hành động này không thể hoàn
            tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminUsers
