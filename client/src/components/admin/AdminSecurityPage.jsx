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
  TextField,
  InputAdornment,
  Grid,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Security,
  Memory,
  Speed,
  Storage,
  Visibility,
  Refresh,
  Warning,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getAuditLogs,
  getSystemMetrics,
  getSystemMetricsHistory,
  getSystemPerformance,
  getSecurityAlerts,
} from '../../api-axios/admin';

const AdminSecurityPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSecurityData();
  }, [tabValue]);

  const loadSecurityData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (tabValue) {
        case 0:
          const logsRes = await getAuditLogs();
          setAuditLogs(logsRes.data);
          break;
        case 1:
          const [metricsRes, historyRes, perfRes] = await Promise.all([
            getSystemMetrics(),
            getSystemMetricsHistory(),
            getSystemPerformance(),
          ]);
          setSystemMetrics(metricsRes.data);
          setPerformanceData(historyRes.data);
          break;
        case 2:
          const alertsRes = await getSecurityAlerts();
          setSecurityAlerts(alertsRes.data);
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
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

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setOpenLogDialog(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE') || action.includes('BAN')) return 'error';
    if (action.includes('UPDATE')) return 'warning';
    return 'info';
  };

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Bảo mật & Audit Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Theo dõi các hoạt động admin và hiệu năng hệ thống
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Audit Logs" />
        <Tab label="Hiệu năng Hệ thống" />
        <Tab label="Cảnh báo Bảo mật" />
      </Tabs>

      {/* Audit Logs Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <TextField
                placeholder="Tìm kiếm logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '400px' }}
              />
              <Button variant="outlined" startIcon={<Refresh />}>
                Làm mới
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hành động</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Đối tượng</TableCell>
                    <TableCell>Người bị tác động</TableCell>
                    <TableCell>Lý do</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Mức độ</TableCell>
                    <TableCell align="center">Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color={getActionColor(log.action)}
                          />
                        </TableCell>
                        <TableCell>{log.admin}</TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell>{log.targetUser}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {log.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {log.timestamp}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.severity}
                            size="small"
                            color={getSeverityColor(log.severity)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewLog(log)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredLogs.length}
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
      )}

      {/* System Performance Tab */}
      {tabValue === 1 && (
        <>
          {/* System Metrics */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Speed color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      CPU Usage
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {systemMetrics.cpu}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.cpu}
                    color={systemMetrics.cpu > 80 ? 'error' : 'primary'}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Memory color="success" />
                    <Typography variant="body2" color="text.secondary">
                      Memory Usage
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {systemMetrics.memory}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.memory}
                    color={systemMetrics.memory > 80 ? 'error' : 'success'}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Storage color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Disk Usage
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {systemMetrics.disk}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.disk}
                    color={systemMetrics.disk > 80 ? 'error' : 'warning'}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Security color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Network Usage
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {systemMetrics.network}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.network}
                    color="info"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Chart */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hiệu năng theo Thời gian
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                  <Line type="monotone" dataKey="requests" stroke="#ffc658" name="Requests" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Security Alerts Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {securityAlerts.map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Warning
                      sx={{
                        fontSize: 40,
                        color: alert.severity === 'high' ? 'error.main' : 
                               alert.severity === 'medium' ? 'warning.main' : 'info.main'
                      }}
                    />
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6">
                          {alert.type}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          color={getSeverityColor(alert.severity)}
                        />
                      </Box>
                      <Typography variant="body1" paragraph>
                        {alert.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alert.timestamp}
                      </Typography>
                    </Box>
                    <Button variant="outlined" size="small">
                      Xử lý
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Log Detail Dialog */}
      <Dialog open={openLogDialog} onClose={() => setOpenLogDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết Audit Log</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hành động
                  </Typography>
                  <Chip
                    label={selectedLog.action}
                    color={getActionColor(selectedLog.action)}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mức độ
                  </Typography>
                  <Chip
                    label={selectedLog.severity}
                    color={getSeverityColor(selectedLog.severity)}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Admin thực hiện
                  </Typography>
                  <Typography variant="body1">{selectedLog.admin}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Đối tượng
                  </Typography>
                  <Typography variant="body1">{selectedLog.target}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Người bị tác động
                  </Typography>
                  <Typography variant="body1">{selectedLog.targetUser}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lý do
                  </Typography>
                  <Typography variant="body1">{selectedLog.reason}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1">{selectedLog.ipAddress}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Thời gian
                  </Typography>
                  <Typography variant="body1">{selectedLog.timestamp}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSecurityPage;
