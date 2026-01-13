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
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Cancel,
  Visibility,
  Block,
  Delete,
  FilterList,
} from '@mui/icons-material';
import {
  getReports,
  getReportById,
  approveReport,
  rejectReport,
  deleteReportedContent,
  banReportedUser,
} from '../../api-axios/admin';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await getReports(params);
      setReports(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };
     

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const reportReasons = {
    spam: 'Spam',
    'hate-speech': 'Nội dung thù ghét',
    harassment: 'Quấy rối',
    impersonation: 'Giả mạo',
    copyright: 'Vi phạm bản quyền',
    'false-information': 'Thông tin sai lệch',
    violence: 'Bạo lực',
    adult: 'Nội dung người lớn',
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setOpenViewDialog(true);
  };

  const handleApproveReport = (reportId) => {
    setReports(reports.map(report =>
      report.id === reportId ? { ...report, status: 'approved' } : report
    ));
    setOpenViewDialog(false);
  };

  const handleRejectReport = (reportId) => {
    setReports(reports.map(report =>
      report.id === reportId ? { ...report, status: 'rejected' } : report
    ));
    setOpenViewDialog(false);
  };

  const handleDeleteContent = (reportId) => {
    // Implement delete content logic
    handleApproveReport(reportId);
    alert('Nội dung đã bị xóa');
  };

  const handleBanUser = (reportId, reportedUser) => {
    // Implement ban user logic
    handleApproveReport(reportId);
    alert(`Người dùng ${reportedUser} đã bị khóa`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'spam': return 'error';
      case 'hate-speech': return 'error';
      case 'harassment': return 'warning';
      case 'copyright': return 'info';
      default: return 'default';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchSearch = 
      report.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUser.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchReason = filterReason === 'all' || report.reason === filterReason;
    return matchSearch && matchStatus && matchReason;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            Hệ thống Báo cáo Vi phạm
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xử lý các khiếu nại và báo cáo từ người dùng
          </Typography>
        </Box>
        <Chip
          label={`${pendingCount} báo cáo chờ xử lý`}
          color="warning"
          sx={{ fontSize: '1rem', padding: '20px 10px' }}
        />
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm báo cáo..."
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
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filterStatus}
                  label="Trạng thái"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="pending">Chờ xử lý</MenuItem>
                  <MenuItem value="approved">Đã duyệt</MenuItem>
                  <MenuItem value="rejected">Đã từ chối</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Lý do</InputLabel>
                <Select
                  value={filterReason}
                  label="Lý do"
                  onChange={(e) => setFilterReason(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {Object.entries(reportReasons).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Loại</TableCell>
                  <TableCell>Nội dung</TableCell>
                  <TableCell>Người báo cáo</TableCell>
                  <TableCell>Người bị báo cáo</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Ưu tiên</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Chip
                          label={report.reportType}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {report.contentTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {report.reporter[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {report.reporter}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{report.reportedUser}</TableCell>
                      <TableCell>
                        <Chip
                          label={reportReasons[report.reason]}
                          size="small"
                          color={getReasonColor(report.reason)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.priority}
                          size="small"
                          color={getPriorityColor(report.priority)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(report.status)}
                          size="small"
                          color={getStatusColor(report.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {report.createdAt}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewReport(report)}
                            title="Xem chi tiết"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {report.status === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApproveReport(report.id)}
                                title="Phê duyệt"
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRejectReport(report.id)}
                                title="Từ chối"
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredReports.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số dòng mỗi trang:"
          />
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết báo cáo</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nội dung bị báo cáo
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {selectedReport.contentTitle}
                    </Typography>
                    <Chip
                      label={`Type: ${selectedReport.reportType}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`ID: ${selectedReport.contentId}`}
                      size="small"
                    />
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Người báo cáo
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Avatar>{selectedReport.reporter[0]}</Avatar>
                    <Typography variant="body1">
                      {selectedReport.reporter}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Người bị báo cáo
                  </Typography>
                  <Typography variant="body1" mt={1}>
                    {selectedReport.reportedUser}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lý do
                  </Typography>
                  <Chip
                    label={reportReasons[selectedReport.reason]}
                    color={getReasonColor(selectedReport.reason)}
                    sx={{ mt: 1 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ưu tiên
                  </Typography>
                  <Chip
                    label={selectedReport.priority}
                    color={getPriorityColor(selectedReport.priority)}
                    sx={{ mt: 1 }}
                  />
                </Grid>

                <Grid size={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mô tả chi tiết
                  </Typography>
                  <Typography variant="body1" mt={1}>
                    {selectedReport.description}
                  </Typography>
                </Grid>

                <Grid size={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Thời gian báo cáo
                  </Typography>
                  <Typography variant="body1" mt={1}>
                    {selectedReport.createdAt}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenViewDialog(false)} color="inherit">
            Đóng
          </Button>
          {selectedReport && selectedReport.status === 'pending' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRejectReport(selectedReport.id)}
              >
                Từ chối báo cáo
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Delete />}
                onClick={() => handleDeleteContent(selectedReport.id)}
              >
                Xóa nội dung
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Block />}
                onClick={() => handleBanUser(selectedReport.id, selectedReport.reportedUser)}
              >
                Khóa người dùng
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReportsPage;
