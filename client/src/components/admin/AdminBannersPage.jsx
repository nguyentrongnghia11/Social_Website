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
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Grid,
    Chip,
    Avatar,
    CircularProgress,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Visibility,
    VisibilityOff,
    Image as ImageIcon,
} from '@mui/icons-material';
import {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBanner,
} from '../../api-axios/admin';
import { uploadBannerImage } from '../../api-axios/banner';

const AdminBannersPage = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        position: 'left',
        imageUrl: '',
        link: '',
        active: true,
        startDate: '',
        endDate: '',
        order: 0,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBanners();
            setBanners(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách banner');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                position: banner.position,
                imageUrl: banner.imageUrl,
                link: banner.link || '',
                active: banner.active,
                startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
                endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
                order: banner.order || 0,
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                position: 'left',
                imageUrl: '',
                link: '',
                active: true,
                startDate: '',
                endDate: '',
                order: 0,
            });
        }
        setSelectedFile(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingBanner(null);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setFormData({ ...formData, imageUrl: previewUrl });
        }
    };

    const handleSubmit = async () => {
        try {
            let imageUrl = formData.imageUrl;

            // Upload file if selected
            if (selectedFile) {
                setUploading(true);
                const uploadRes = await uploadBannerImage(selectedFile);
                imageUrl = uploadRes.data.data.url;
            }

            const data = {
                ...formData,
                imageUrl,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
            };

            if (editingBanner) {
                await updateBanner(editingBanner._id, data);
                setSnackbar({ open: true, message: 'Cập nhật banner thành công', severity: 'success' });
            } else {
                await createBanner(data);
                setSnackbar({ open: true, message: 'Tạo banner thành công', severity: 'success' });
            }

            handleCloseDialog();
            loadBanners();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Lỗi khi lưu banner',
                severity: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleToggle = async (bannerId) => {
        try {
            await toggleBanner(bannerId);
            setSnackbar({ open: true, message: 'Cập nhật trạng thái thành công', severity: 'success' });
            loadBanners();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Lỗi khi cập nhật trạng thái',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (bannerId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;

        try {
            await deleteBanner(bannerId);
            setSnackbar({ open: true, message: 'Xóa banner thành công', severity: 'success' });
            loadBanners();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Lỗi khi xóa banner',
                severity: 'error'
            });
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getPositionLabel = (position) => {
        const labels = {
            left: 'Trái',
            right: 'Phải',
            top: 'Trên',
            bottom: 'Dưới',
            popup: 'Popup',
        };
        return labels[position] || position;
    };

    if (loading && banners.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Quản lý Banner
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Quản lý banner hiển thị trên trang web
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Tạo Banner Mới
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Hình ảnh</TableCell>
                                    <TableCell>Tiêu đề</TableCell>
                                    <TableCell>Vị trí</TableCell>
                                    <TableCell>Link</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                    <TableCell>Thứ tự</TableCell>
                                    <TableCell align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {banners
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((banner) => (
                                        <TableRow key={banner._id} hover>
                                            <TableCell>
                                                {banner.imageUrl ? (
                                                    <Avatar
                                                        src={banner.imageUrl}
                                                        variant="rounded"
                                                        sx={{ width: 80, height: 60 }}
                                                    >
                                                        <ImageIcon />
                                                    </Avatar>
                                                ) : (
                                                    <Avatar variant="rounded" sx={{ width: 80, height: 60 }}>
                                                        <ImageIcon />
                                                    </Avatar>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{banner.title}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getPositionLabel(banner.position)}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                                                    {banner.link || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={banner.active ? 'Hoạt động' : 'Tắt'}
                                                    size="small"
                                                    color={banner.active ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>{banner.order}</TableCell>
                                            <TableCell>
                                                <Box display="flex" justifyContent="center" gap={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        color={banner.active ? 'warning' : 'success'}
                                                        onClick={() => handleToggle(banner._id)}
                                                        title={banner.active ? 'Tắt' : 'Bật'}
                                                    >
                                                        {banner.active ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenDialog(banner)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(banner._id)}
                                                        title="Xóa"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={banners.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Số dòng mỗi trang:"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}–${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
                        }
                    />
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingBanner ? 'Chỉnh sửa Banner' : 'Tạo Banner Mới'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tiêu đề"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Vị trí</InputLabel>
                                    <Select
                                        value={formData.position}
                                        label="Vị trí"
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    >
                                        <MenuItem value="left">Trái</MenuItem>
                                        <MenuItem value="right">Phải</MenuItem>
                                        <MenuItem value="top">Trên</MenuItem>
                                        <MenuItem value="bottom">Dưới</MenuItem>
                                        <MenuItem value="popup">Popup</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Thứ tự"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Hình ảnh Banner *
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<ImageIcon />}
                                        fullWidth
                                        sx={{ mb: 1 }}
                                    >
                                        {selectedFile ? 'Thay đổi ảnh' : 'Chọn ảnh từ máy'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                        />
                                    </Button>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        Hoặc nhập URL trực tiếp:
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="https://example.com/image.jpg"
                                        value={selectedFile ? '' : formData.imageUrl}
                                        onChange={(e) => {
                                            setSelectedFile(null);
                                            setFormData({ ...formData, imageUrl: e.target.value });
                                        }}
                                        disabled={!!selectedFile}
                                    />
                                    {selectedFile && (
                                        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                                            File đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                            {formData.imageUrl && (
                                <Grid item xs={12}>
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                                        <Typography variant="caption" color="text.secondary" gutterBottom>
                                            Xem trước:
                                        </Typography>
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </Box>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Link (tùy chọn)"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    helperText="URL khi click vào banner"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Ngày bắt đầu (tùy chọn)"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Ngày kết thúc (tùy chọn)"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                    }
                                    label="Kích hoạt banner"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Hủy</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!formData.title || (!formData.imageUrl && !selectedFile) || uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : null}
                    >
                        {uploading ? 'Đang tải lên...' : editingBanner ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminBannersPage;
