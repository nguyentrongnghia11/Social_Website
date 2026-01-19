import React, { useState, useEffect } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
} from '@mui/material';
import {
  Search,
  Edit,
  Block,
  LockOpen,
  Delete,
  History,
  Add,
  Download,
  Refresh,
  Security,
} from '@mui/icons-material';
import {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserHistory,
  getAvailablePermissions,
  getUserPermissions,
  updateUserPermissions,
  createUser,
} from '../../api-axios/admin';

const AdminUsersPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Permission management states
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionLoading, setPermissionLoading] = useState(false);

  // Add User Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', status: 'active' });
  const [addLoading, setAddLoading] = useState(false);

  // Login History states
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadAvailablePermissions();
  }, [statusFilter, roleFilter]);

  const loadAvailablePermissions = async () => {
    try {
      const res = await getAvailablePermissions();
      setAvailablePermissions(res.data.data || []);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await getUsers(params);
      console.log("Fetched users:", res.data.data);
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleViewHistory = async (user) => {
    setSelectedUser(user);
    setHistoryLoading(true);
    setOpenHistoryDialog(true);
    try {
      const res = await getUserHistory(user._id);
      setLoginHistory(res.data.data || []);
    } catch (err) {
      console.error('Error loading history:', err);
      setLoginHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Add User handler
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin',
        severity: 'error'
      });
      return;
    }

    setAddLoading(true);
    try {
      const res = await createUser(newUser);
      setUsers([res.data.data, ...users]);
      setOpenAddDialog(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', status: 'active' });
      setSnackbar({
        open: true,
        message: 'Tạo người dùng thành công',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể tạo người dùng',
        severity: 'error'
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleBan = async (userId) => {
    console.log('Toggling ban for user ID:', userId);
    try {
      const user = users.find(u => u._id === userId);
      const newStatus = user.status === 'banned' ? 'active' : 'banned';
      await updateUserStatus(userId, newStatus);
      setUsers(users.map(u =>
        u._id === userId ? { ...u, status: newStatus } : u
      ));
      setSnackbar({
        open: true,
        message: `Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể cập nhật trạng thái',
        severity: 'error'
      });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));
      setOpenEditDialog(false);
      setSnackbar({
        open: true,
        message: 'Đã cập nhật quyền người dùng',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể cập nhật quyền',
        severity: 'error'
      });
    }
  };

  // Permission management handlers
  const handleOpenPermissions = async (user) => {
    setSelectedUser(user);
    setPermissionLoading(true);
    setOpenPermissionDialog(true);
    try {
      const res = await getUserPermissions(user._id);
      setUserPermissions(res.data.data.permissions || []);
    } catch (err) {
      console.error('Error loading user permissions:', err);
      setUserPermissions([]);
    } finally {
      setPermissionLoading(false);
    }
  };

  const handlePermissionToggle = (permission) => {
    setUserPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await updateUserPermissions(selectedUser._id, userPermissions);
      setUsers(users.map(user =>
        user._id === selectedUser._id ? { ...user, permissions: userPermissions } : user
      ));
      setOpenPermissionDialog(false);
      setSnackbar({
        open: true,
        message: 'Đã cập nhật quyền hạn người dùng',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể cập nhật quyền hạn',
        severity: 'error'
      });
    }
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      // User permissions
      'create_post': 'Tạo bài viết',
      'edit_own_post': 'Sửa bài viết của mình',
      'delete_own_post': 'Xóa bài viết của mình',
      'create_comment': 'Tạo bình luận',
      'edit_own_comment': 'Sửa bình luận của mình',
      'delete_own_comment': 'Xóa bình luận của mình',
      // Moderator permissions
      'hide_post': 'Ẩn bài viết',
      'hide_comment': 'Ẩn bình luận',
      'delete_any_post': 'Xóa bất kỳ bài viết',
      'delete_any_comment': 'Xóa bất kỳ bình luận',
      'ban_user_comment': 'Cấm user bình luận',
      'ban_user_post': 'Cấm user đăng bài',
      // Admin permissions
      'manage_users': 'Quản lý người dùng',
      'view_admin_panel': 'Truy cập trang Admin',
    };
    return labels[permission] || permission;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            Quản lý Người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý danh sách người dùng, phân quyền và trạng thái tài khoản
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAddDialog(true)}>
          Thêm người dùng
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo tên, email, username..."
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
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={roleFilter}
                  label="Vai trò"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="banned">Đã khóa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                sx={{ height: '56px' }}
              >
                Xuất Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Người dùng</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tham gia</TableCell>
                    <TableCell>Đăng nhập gần nhất</TableCell>
                    <TableCell>Bài viết</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user, index) => (
                      <TableRow key={user.id || user._id || `user-${index}`} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar src={user.avatar}>{user.name?.[0] || 'U'}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={getRoleColor(user.role)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                            size="small"
                            color={getStatusColor(user.status)}
                          />
                        </TableCell>
                        <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{user.postsCount}</TableCell>
                        <TableCell>
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditUser(user)}
                              title="Chỉnh sửa"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color={user.status === 'banned' ? 'success' : 'error'}
                              onClick={() => handleToggleBan(user._id)}
                              title={user.status === 'banned' ? 'Mở khóa' : 'Khóa tài khoản'}
                            >
                              {user.status === 'banned' ? <LockOpen fontSize="small" /> : <Block fontSize="small" />}
                            </IconButton>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewHistory(user)}
                              title="Xem lịch sử"
                            >
                              <History fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleOpenPermissions(user)}
                              title="Quản lý quyền hạn"
                            >
                              <Security fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
            }
            sx={{
              '.MuiTablePagination-toolbar': {
                alignItems: 'center'
              },
              '.MuiTablePagination-selectLabel': {
                margin: 0
              },
              '.MuiTablePagination-displayedRows': {
                margin: 0
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tên: {selectedUser.name}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Email: {selectedUser.email}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={selectedUser.role}
                  label="Vai trò"
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={() => selectedUser && handleRoleChange(selectedUser._id, selectedUser.role)}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lịch sử đăng nhập</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedUser.name}
              </Typography>
              {historyLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : loginHistory.length === 0 ? (
                <Alert severity="info">Không có lịch sử đăng nhập</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Hành động</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>User Agent</TableCell>
                        <TableCell>Thời gian</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loginHistory.map((item, index) => (
                        <TableRow key={`history-${index}`}>
                          <TableCell>
                            <Chip
                              label={item.action === 'login' ? 'Đăng nhập' : item.action === 'login_google' ? 'Đăng nhập Google' : item.action}
                              size="small"
                              color={item.action?.includes('login') ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{item.ip || 'N/A'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.userAgent || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={openPermissionDialog} onClose={() => setOpenPermissionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Security color="secondary" />
            Quản lý quyền hạn
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Người dùng: {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vai trò: {selectedUser.role}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Chọn quyền hạn:
              </Typography>
              {permissionLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <FormGroup>
                  {availablePermissions.map((permission) => (
                    <FormControlLabel
                      key={permission}
                      control={
                        <Checkbox
                          checked={userPermissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                          color="primary"
                        />
                      }
                      label={getPermissionLabel(permission)}
                    />
                  ))}
                </FormGroup>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSavePermissions}
            disabled={permissionLoading}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm người dùng mới</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Tên"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={newUser.role}
                label="Vai trò"
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={newUser.status}
                label="Trạng thái"
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="banned">Đã khóa</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleAddUser}
            disabled={addLoading}
          >
            {addLoading ? <CircularProgress size={24} /> : 'Tạo người dùng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage;
