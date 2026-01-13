import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Notifications,
  Image,
  Description,
  Add,
  Delete,
  Edit,
} from '@mui/icons-material';
import {
  getSettings,
  updateSettings,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  getBroadcasts,
  createBroadcast,
} from '../../api-axios/admin';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
    loadBanners();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await getBanners();
      setBanners(res.data);
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  };
    

  const [broadcasts, setBroadcasts] = useState([
    {
      id: 1,
      title: 'Bảo trì hệ thống',
      message: 'Hệ thống sẽ bảo trì vào 22:00 ngày 20/03/2024',
      type: 'warning',
      sent: true,
      sentAt: '2024-03-15 10:00',
    },
    {
      id: 2,
      title: 'Tính năng mới',
      message: 'Chúng tôi vừa ra mắt tính năng video call!',
      type: 'info',
      sent: true,
      sentAt: '2024-03-10 14:30',
    },
  ]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openBroadcastDialog, setOpenBroadcastDialog] = useState(false);
  const [openBannerDialog, setOpenBannerDialog] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const handleSettingChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    setSnackbar({
      open: true,
      message: 'Cài đặt đã được lưu thành công!',
      severity: 'success',
    });
  };

  const handleSendBroadcast = () => {
    if (!newBroadcast.title || !newBroadcast.message) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin!',
        severity: 'error',
      });
      return;
    }

    setBroadcasts([
      {
        id: Date.now(),
        ...newBroadcast,
        sent: true,
        sentAt: new Date().toISOString(),
      },
      ...broadcasts,
    ]);

    setNewBroadcast({ title: '', message: '', type: 'info' });
    setOpenBroadcastDialog(false);
    setSnackbar({
      open: true,
      message: 'Thông báo đã được gửi thành công!',
      severity: 'success',
    });
  };

  const handleDeleteBanner = (id) => {
    setBanners(banners.filter(banner => banner.id !== id));
    setSnackbar({
      open: true,
      message: 'Banner đã được xóa!',
      severity: 'success',
    });
  };

  const handleToggleBanner = (id) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, active: !banner.active } : banner
    ));
  };

  const getBroadcastTypeColor = (type) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Cấu hình Hệ thống
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quản lý cài đặt website, thông báo hệ thống và quảng cáo
        </Typography>
      </Box>

      {/* General Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cài đặt Chung
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên Website"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Liên hệ"
                value={settings.contactEmail}
                onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả Website"
                multiline
                rows={2}
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Cài đặt Chức năng
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  />
                }
                label="Chế độ Bảo trì"
              />
              {settings.maintenanceMode && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Website đang ở chế độ bảo trì. Chỉ Admin có thể truy cập.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowRegistration}
                    onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                  />
                }
                label="Cho phép Đăng ký"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireEmailVerification}
                    onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                  />
                }
                label="Yêu cầu Xác thực Email"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Giới hạn Upload & Content
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Kích thước Upload tối đa (MB)"
                value={settings.maxUploadSize}
                onChange={(e) => handleSettingChange('maxUploadSize', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Độ dài Bài viết tối đa (ký tự)"
                value={settings.maxPostLength}
                onChange={(e) => handleSettingChange('maxPostLength', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveSettings}
            >
              Lưu Cài đặt
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Broadcast Notifications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Thông báo Hệ thống
            </Typography>
            <Button
              variant="contained"
              startIcon={<Notifications />}
              onClick={() => setOpenBroadcastDialog(true)}
            >
              Gửi Thông báo
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Nội dung</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Thời gian gửi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {broadcasts.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell>{broadcast.title}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {broadcast.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={broadcast.type}
                        size="small"
                        color={getBroadcastTypeColor(broadcast.type)}
                      />
                    </TableCell>
                    <TableCell>{broadcast.sentAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Banner Management */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Quản lý Banner/Quảng cáo
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenBannerDialog(true)}
            >
              Thêm Banner
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Vị trí</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>{banner.title}</TableCell>
                    <TableCell>
                      <Chip label={banner.position} size="small" />
                    </TableCell>
                    <TableCell>{banner.link}</TableCell>
                    <TableCell>
                      <Switch
                        checked={banner.active}
                        onChange={() => handleToggleBanner(banner.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteBanner(banner.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Broadcast Dialog */}
      <Dialog open={openBroadcastDialog} onClose={() => setOpenBroadcastDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gửi Thông báo Hệ thống</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Tiêu đề"
              value={newBroadcast.title}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nội dung"
              multiline
              rows={4}
              value={newBroadcast.message}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Loại thông báo"
              value={newBroadcast.type}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, type: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="info">Thông tin</option>
              <option value="warning">Cảnh báo</option>
              <option value="success">Thành công</option>
              <option value="error">Lỗi</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBroadcastDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSendBroadcast}>
            Gửi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSettingsPage;
